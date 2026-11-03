$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Read-EnvValue([string]$name, [string]$fallback) {
  if (-not (Test-Path .env)) { return $fallback }
  $line = Select-String -Path .env -Pattern "^$name=" | Select-Object -Last 1
  if (-not $line) { return $fallback }
  return ($line.Line -split '=', 2)[1]
}

$authBase = "http://localhost:$(Read-EnvValue 'AUTH_PORT' '3001')"
$apiBase = "http://localhost:$(Read-EnvValue 'ACTIVITIES_PORT' '3002')"
$utf8 = New-Object System.Text.UTF8Encoding $false

function Invoke-Json {
  param(
    [string]$Method,
    [string]$Url,
    [string]$Token,
    $Body
  )
  $curlArgs = @('-sS', '-w', "`nHTTPSTATUS:%{http_code}", '-X', $Method, $Url)
  if ($Token) { $curlArgs += @('-H', "Authorization: Bearer $Token") }
  $temp = $null
  if ($null -ne $Body) {
    $temp = Join-Path $env:TEMP ("profelink-" + [guid]::NewGuid().ToString() + '.json')
    [IO.File]::WriteAllText($temp, ($Body | ConvertTo-Json -Compress), $utf8)
    $curlArgs += @('-H', 'Content-Type: application/json', '--data-binary', "@$temp")
  }
  $raw = & curl.exe @curlArgs
  if ($temp) { Remove-Item $temp -Force }
  $text = if ($raw -is [array]) { $raw -join "`n" } else { [string]$raw }
  if ($text -notmatch 'HTTPSTATUS:(\d+)') { throw "Sin respuesta de $Url" }
  $status = [int]$Matches[1]
  $payload = ($text -replace 'HTTPSTATUS:\d+', '').Trim()
  $data = $null
  if ($payload) { $data = $payload | ConvertFrom-Json }
  return @{ Status = $status; Data = $data }
}

function Assert-Status($result, [int]$expected, [string]$label) {
  if ($result.Status -ne $expected) {
    $detail = $result.Data | ConvertTo-Json -Compress
    throw "$label esperaba $expected y recibió $($result.Status) $detail"
  }
  Write-Host "OK  $label"
}

function Assert-Ok($result, [string]$label) {
  if ($result.Status -lt 200 -or $result.Status -ge 300) {
    $detail = $result.Data | ConvertTo-Json -Compress
    throw "$label esperaba éxito y recibió $($result.Status) $detail"
  }
  Write-Host "OK  $label"
}

$demo = Invoke-Json POST "$authBase/auth/login" $null @{ email = 'demo@profelink.dev'; password = 'Demo1234!' }
Assert-Ok $demo 'entra la cuenta demo'
$teacher = $demo.Data.accessToken

$suffix = [guid]::NewGuid().ToString('N').Substring(0, 8)
$player = Invoke-Json POST "$authBase/auth/register" $null @{
  displayName = 'Ana Curso'
  email = "ana.$suffix@profelink.dev"
  password = 'Demo1234!'
}
Assert-Ok $player 'registra un perfil participante'
$student = $player.Data.accessToken

$quizzes = Invoke-Json GET "$apiBase/quizzes" $teacher $null
Assert-Ok $quizzes 'el profesor consulta sus cuestionarios'
$seeded = @($quizzes.Data) | Where-Object { $_.title -eq 'Paradigmas en el aula' } | Select-Object -First 1
if (-not $seeded) { throw 'No está el cuestionario de demostración.' }
Write-Host 'OK  cuestionario demo presente'

$forbidden = Invoke-Json PATCH "$apiBase/quizzes/$($seeded.id)" $student @{ title = 'Intento ajeno'; description = 'no' }
Assert-Status $forbidden 403 'un participante no edita el cuestionario del profesor'

$created = Invoke-Json POST "$apiBase/quizzes" $teacher @{ title = "Comprobacion $suffix"; description = 'Sala de prueba' }
Assert-Ok $created 'crea un cuestionario'
$quizId = $created.Data.id

$first = Invoke-Json POST "$apiBase/quizzes/$quizId/questions" $teacher @{
  prompt = 'La primera respuesta correcta suma un punto.'
  correctAnswer = $true
  timeLimitSeconds = 30
}
Assert-Ok $first 'crea la primera pregunta'
if ($first.Status -eq 200) { }
$second = Invoke-Json POST "$apiBase/quizzes/$quizId/questions" $teacher @{
  prompt = 'Una respuesta fuera de tiempo tambien suma.'
  correctAnswer = $false
  timeLimitSeconds = 5
}
Assert-Ok $second 'crea la segunda pregunta'

$png = Join-Path $env:TEMP 'profelink-pixel.png'
[IO.File]::WriteAllBytes($png, [Convert]::FromBase64String('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC'))
$uploadRaw = & curl.exe -sS -w "`nHTTPSTATUS:%{http_code}" -H "Authorization: Bearer $teacher" -F "file=@$png;type=image/png" "$apiBase/quizzes/$quizId/questions/$($first.Data.id)/image"
if ([string]$uploadRaw -notmatch 'HTTPSTATUS:(\d+)') { throw 'La carga de imagen no respondió.' }
if ([int]$Matches[1] -ge 400) { throw "La imagen fue rechazada: $uploadRaw" }
$image = (($uploadRaw -replace 'HTTPSTATUS:\d+', '').Trim() | ConvertFrom-Json)
Write-Host 'OK  guarda una imagen PNG'

$media = & curl.exe -sS -o NUL -w '%{http_code} %{content_type}' "$apiBase$($image.imagePath)"
if ($media -notmatch '^200 image/png') { throw "La imagen no se sirve a otros dispositivos: $media" }
Write-Host 'OK  la imagen se descarga sin tocar la base desde otro cliente'

$blocked = Invoke-Json PATCH "$apiBase/quizzes/$quizId/questions/$($second.Data.id)" $student @{ prompt = 'Cambio prohibido de la pregunta' }
Assert-Status $blocked 403 'un participante no modifica preguntas'

$session = Invoke-Json POST "$apiBase/sessions" $teacher @{ quizId = $quizId }
Assert-Ok $session 'abre la sala'
$code = $session.Data.code
$early = Invoke-Json POST "$apiBase/sessions/$code/start" $student $null
Assert-Status $early 403 'un participante no inicia la partida'
$alone = Invoke-Json POST "$apiBase/sessions/$code/start" $teacher $null
Assert-Status $alone 409 'no inicia sin participantes'

$joined = Invoke-Json POST "$apiBase/sessions/$code/join" $student $null
Assert-Ok $joined 'el participante entra'
$again = Invoke-Json POST "$apiBase/sessions/$code/join" $student $null
Assert-Ok $again 'reconectar no duplica la participación'
if ([int]$again.Data.playerCount -ne 1) { throw "La reconexión duplicó participantes: $($again.Data.playerCount)" }
Write-Host 'OK  sigue habiendo una sola participación'

$started = Invoke-Json POST "$apiBase/sessions/$code/start" $teacher $null
Assert-Ok $started 'el anfitrión inicia'
if ($null -ne $started.Data.question.correctAnswer) { throw 'La respuesta correcta se filtró con la pregunta abierta.' }
Write-Host 'OK  la respuesta correcta sigue oculta'

$questionId = $started.Data.question.id
$answer = Invoke-Json POST "$apiBase/sessions/$code/answers" $student @{ questionId = $questionId; value = $true }
Assert-Ok $answer 'acepta la respuesta'
$duplicate = Invoke-Json POST "$apiBase/sessions/$code/answers" $student @{ questionId = $questionId; value = $true }
Assert-Status $duplicate 409 'el reenvío no vuelve a sumar'
if ($duplicate.Data.code -ne 'ALREADY_ANSWERED') { throw "Código inesperado $($duplicate.Data.code)" }

$closed = Invoke-Json POST "$apiBase/sessions/$code/close" $teacher $null
Assert-Ok $closed 'cierra la pregunta y revela la respuesta'
if ($closed.Data.question.correctAnswer -ne $true) { throw 'No reveló la respuesta correcta.' }
if ([int]$closed.Data.players[0].score -ne 1) { throw "El puntaje no quedó en 1: $($closed.Data.players[0].score)" }
Write-Host 'OK  el acierto vale un punto y se revela al cerrar'

$lateClose = Invoke-Json POST "$apiBase/sessions/$code/answers" $student @{ questionId = $questionId; value = $false }
Assert-Status $lateClose 409 'rechaza otra respuesta cuando la pregunta ya cerró'

$next = Invoke-Json POST "$apiBase/sessions/$code/next" $teacher $null
Assert-Ok $next 'abre la siguiente pregunta'
Start-Sleep -Seconds 7
$late = Invoke-Json POST "$apiBase/sessions/$code/answers" $student @{ questionId = $next.Data.question.id; value = $false }
Assert-Status $late 409 'rechaza la respuesta tardía'
if ($late.Data.code -ne 'TOO_LATE' -and $late.Data.code -ne 'QUESTION_CLOSED') {
  throw "Se esperaba TOO_LATE o QUESTION_CLOSED y llegó $($late.Data.code)"
}

Invoke-Json POST "$apiBase/sessions/$code/close" $teacher $null | Out-Null
$finished = Invoke-Json POST "$apiBase/sessions/$code/next" $teacher $null
if ($finished.Status -ge 400) {
  $finished = Invoke-Json POST "$apiBase/sessions/$code/finish" $teacher $null
}
Assert-Ok $finished 'termina la partida'
$results = Invoke-Json GET "$apiBase/sessions/$code/results" $teacher $null
Assert-Ok $results 'guarda y consulta la clasificación'
if ([int]$results.Data.ranking[0].score -ne 1) { throw 'La clasificación no conservó el punto.' }
Write-Host 'OK  la clasificación quedó guardada'

$other = Invoke-Json POST "$apiBase/sessions" $teacher @{ quizId = $quizId }
Assert-Ok $other 'abre una segunda sala'
$otherJoin = Invoke-Json POST "$apiBase/sessions/$($other.Data.code)/join" $student $null
Assert-Ok $otherJoin 'entra a la segunda sala'
if ([int]$otherJoin.Data.yourScore -ne 0) { throw 'El puntaje de la primera sala se mezcló con la segunda.' }
if ($otherJoin.Data.code -eq $code) { throw 'Las salas compartieron código.' }
Write-Host 'OK  las salas no mezclan participantes ni puntajes'
Write-Host 'Comprobaciones de la API completadas.'
