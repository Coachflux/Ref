JavaScript (in script.js file)
let points = 0;
let lastMineTime = localStorage.getItem('lastMineTime');
let pointsStored = localStorage.getItem('points');

if (pointsStored) {
    points = parseInt(pointsStored);
    document.getElementById('points').innerText = `Points: ${points}`;
}

if (lastMineTime) {
    lastMineTime = parseInt(lastMineTime);
    let currentTime = new Date().getTime();
    let timeDiff = currentTime - lastMineTime;
    let sixHours = 6 * 60 * 60 * 1000;

    if (timeDiff < sixHours) {
        document.getElementById('mine-btn').disabled = true;
        let remainingTime = sixHours - timeDiff;
        let minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        document.getElementById('last-mine-time').innerText = `Come back in ${minutes} minutes ${seconds} seconds`;
        let intervalId = setInterval(() => {
            remainingTime -= 1000;
            minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
            document.getElementById('last-mine-time').innerText = `Come back in ${minutes} minutes ${seconds} seconds`;
            if (remainingTime <= 0) {
                clearInterval(intervalId);
                document.getElementById('mine-btn').disabled = false;
                document.getElementById('last-mine-time').innerText = '';
            }
        }, 1000);
    }
}

document.getElementById('mine-btn').addEventListener('click', () => {
    points += 10;
    document.getElementById('points').innerText = `Points: ${points}`;
    localStorage.setItem('points', points);
    localStorage.setItem('lastMineTime', new Date().getTime());
    document.getElementById('mine-btn').disabled = true;
    let sixHours = 6 * 60 * 60 * 1000;
    let intervalId = setInterval(() => {
        let currentTime = new Date().getTime();
        let lastMineTime = parseInt(localStorage.getItem('lastMineTime'));
        let timeDiff = currentTime - lastMineTime;
        let remainingTime = sixHours - timeDiff;
        let minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        document.getElementById('last-mine-time').innerText = `Come back in ${minutes} minutes ${seconds} seconds`;
        if (timeDiff >= sixHours) {
            clearInterval(intervalId);
            document.getElementById('mine-btn').disabled = false;
            document.getElementById('last-mine-time').innerText = '';
        }
    }, 1000);
});
