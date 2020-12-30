echo "Starting servers"

start "Pendulum" /min cmd /C "node pendulum.js 8081"
start "Pendulum" /min cmd /C "node pendulum.js 8082"
start "Pendulum" /min cmd /C "node pendulum.js 8083"
start "Pendulum" /min cmd /C "node pendulum.js 8084"
start "Pendulum" /min cmd /C "node pendulum.js 8085"


echo "Servers running, continue to shut them down"

pause

taskkill /fi "WindowTitle eq Pendulum"