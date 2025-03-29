// Schedule script
const scheduleDataUrl = 'https://neunzugmilradio.airtime.pro/api/week-info';

fetch(scheduleDataUrl)
    .then(response => response.json())
    .then(data => {
        const thisWeekContainer = document.getElementById('this-week-container');
        const nextWeekContainer = document.getElementById('next-week-container');
        const now = new Date();
        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Populate the schedule for both weeks
        for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
            const weekTitle = weekOffset === 0 ? "This Week" : "Next Week";
            const container = weekOffset === 0 ? thisWeekContainer : nextWeekContainer;

            daysOrder.forEach(day => {
                const currentDayData = data[weekOffset === 0 ? day : `next${day}`] || [];
                const non90milShows = currentDayData.filter(show => show.name !== "90mil Radio");

                if (non90milShows.length > 0) {
                    const showDay = new Date(now);
                    const dayIndex = daysOrder.indexOf(day);
                    const todayIndex = (now.getDay() + 6) % 7;
                    const dayDifference = (dayIndex - todayIndex) + (weekOffset * 7);
                    showDay.setDate(now.getDate() + dayDifference);

                    const dayBlock = document.createElement('div');
                    dayBlock.className = 'day-block';

                    const dayHeader = document.createElement('div');
                    dayHeader.className = 'day-header';
                    const formattedDate = `${day.charAt(0).toUpperCase() + day.slice(1)} - ${('0' + showDay.getDate()).slice(-2)}.${('0' + (showDay.getMonth() + 1)).slice(-2)}.${showDay.getFullYear()}`;
                    dayHeader.textContent = `${weekTitle}: ${formattedDate}`;
                    dayBlock.appendChild(dayHeader);

                    non90milShows.forEach(show => {
                        const showElement = createShowElement(show);
                        dayBlock.appendChild(showElement);
                    });

                    container.appendChild(dayBlock);
                }
            });
        }
    })
    .catch(error => console.error('Error fetching schedule data:', error));

function createShowElement(show) {
    const showStart = new Date(show.start_timestamp);
    const showEnd = new Date(show.end_timestamp);
    const showElement = document.createElement('div');
    showElement.className = 'show';

    const timeInfo = document.createElement('div');
    timeInfo.className = 'time-info';
    timeInfo.textContent = `${showStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${showEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    const showInfo = document.createElement('div');
    showInfo.className = 'show-info';
    if (show.name.toLowerCase().includes('hosted by')) {
        const splitName = show.name.split(/(hosted by)/i);
        showInfo.innerHTML = `<b>${splitName[0].trim()}</b><br><span class="hosted-by">${splitName[1]} ${splitName[2]}</span>`;
    } else {
        showInfo.innerHTML = `<b>${show.name}</b>`;
    }

    const hoverBox = document.createElement('div');
    hoverBox.className = 'hover-box';
    let showDescription = show.description || 'No description available';
    hoverBox.textContent = showDescription;
    showInfo.appendChild(hoverBox);

    showElement.appendChild(timeInfo);
    showElement.appendChild(showInfo);
    return showElement;
} 