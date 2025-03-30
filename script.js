// Schedule script
const scheduleDataUrl = 'https://neunzugmilradio.airtime.pro/api/week-info';

// Add helper function for HTML entities
function decodeHtmlEntities(text) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Add at the top with other constants
let isDragging = false;
let startX;
let scrollLeft;

function addDragToScroll(element) {
    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        element.style.cursor = 'grabbing';
        startX = e.pageX - element.offsetLeft;
        scrollLeft = element.scrollLeft;
    });

    element.addEventListener('mouseleave', () => {
        isDragging = false;
        element.style.cursor = 'grab';
    });

    element.addEventListener('mouseup', () => {
        isDragging = false;
        element.style.cursor = 'grab';
    });

    element.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - element.offsetLeft;
        const walk = x - startX; // Scroll speed multiplier
        element.scrollLeft = scrollLeft - walk;
    });
}

fetch(scheduleDataUrl)
    .then(response => response.json())
    .then(data => {
        const thisWeekContainer = document.getElementById('this-week-container');
        const nextWeekContainer = document.getElementById('next-week-container');
        const now = new Date();
        const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Add drag scrolling to both containers
        addDragToScroll(thisWeekContainer);
        addDragToScroll(nextWeekContainer);

        // Set initial cursor style
        thisWeekContainer.style.cursor = 'grab';
        nextWeekContainer.style.cursor = 'grab';

        // Populate the schedule for both weeks
        for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
            const container = weekOffset === 0 ? thisWeekContainer : nextWeekContainer;
            let firstDayWithContent = null;

            // Calculate earliest and latest times for the week
            let weekEarliestHour = 23;
            let weekLatestHour = 0;

            // First pass: find earliest and latest times across all days
            daysOrder.forEach(day => {
                const currentDayData = data[weekOffset === 0 ? day : `next${day}`] || [];
                const non90milShows = currentDayData.filter(show => show.name !== "90mil Radio");

                non90milShows.forEach(show => {
                    const startHour = new Date(show.start_timestamp).getHours();
                    const endHour = new Date(show.end_timestamp).getHours();
                    weekEarliestHour = Math.min(weekEarliestHour, startHour);
                    weekLatestHour = Math.max(weekLatestHour, endHour);
                });
            });

            // Second pass: create day blocks with consistent timing
            daysOrder.forEach(day => {
                const currentDayData = data[weekOffset === 0 ? day : `next${day}`] || [];
                const non90milShows = currentDayData.filter(show => show.name !== "90mil Radio");

                const showDay = new Date(now);
                const dayIndex = daysOrder.indexOf(day);
                const todayIndex = (now.getDay() + 6) % 7;
                const dayDifference = (dayIndex - todayIndex) + (weekOffset * 7);
                showDay.setDate(now.getDate() + dayDifference);

                const dayBlock = createDayBlock(day, non90milShows, showDay, weekEarliestHour, weekLatestHour);

                if (non90milShows.length > 0 && !firstDayWithContent) {
                    firstDayWithContent = dayBlock;
                }

                container.appendChild(dayBlock);
            });

            // Scroll to first day with content
            if (firstDayWithContent) {
                requestAnimationFrame(() => {
                    const container = weekOffset === 0 ? thisWeekContainer : nextWeekContainer;
                    const scrollAmount = firstDayWithContent.offsetLeft - container.offsetLeft;
                    container.scrollTo({
                        left: scrollAmount,
                        behavior: 'smooth'
                    });
                });
            }
        }
    })
    .catch(error => console.error('Error fetching schedule data:', error));

function createDayBlock(day, shows, showDay, weekEarliestHour, weekLatestHour) {
    const dayBlock = document.createElement('div');
    dayBlock.className = `day-block${shows.length === 0 ? ' empty' : ''}`;

    const dayHeader = document.createElement('div');
    dayHeader.className = 'day-header';

    if (shows.length === 0) {
        dayHeader.textContent = day.charAt(0).toUpperCase() + day.slice(1);
    } else {
        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
        const dateStr = `${('0' + showDay.getDate()).slice(-2)}.${('0' + (showDay.getMonth() + 1)).slice(-2)}.${showDay.getFullYear()}`;

        // Create separate spans for day and date
        const daySpan = document.createElement('span');
        daySpan.textContent = dayName;
        const dateSpan = document.createElement('span');
        dateSpan.textContent = dateStr;

        dayHeader.appendChild(daySpan);
        dayHeader.appendChild(dateSpan);

        // Adjust container height to match new pixels per minute, plus 2px margin
        const timeRangeMinutes = (weekLatestHour - weekEarliestHour + 1) * 60;
        const containerHeight = (timeRangeMinutes * 0.6) + 42; // Added 2px extra margin
        dayBlock.style.height = `${containerHeight}px`;

        shows.forEach(show => {
            const showElement = createShowElement(show, weekEarliestHour);
            dayBlock.appendChild(showElement);
        });
    }

    dayBlock.appendChild(dayHeader);
    return dayBlock;
}

function createShowElement(show, earliestHour) {
    const showStart = new Date(show.start_timestamp);
    const showEnd = new Date(show.end_timestamp);
    const showElement = document.createElement('div');
    showElement.className = 'show';

    // Calculate position and height based on time (offset by earliest hour)
    const startMinutes = (showStart.getHours() - earliestHour) * 60 + showStart.getMinutes();
    const endMinutes = (showEnd.getHours() - earliestHour) * 60 + showEnd.getMinutes();

    // Ensure shows end exactly at the hour boundary
    const duration = endMinutes - startMinutes;
    const pixelsPerMinute = 0.6;
    const top = Math.round(startMinutes * pixelsPerMinute) + 40;
    const height = Math.floor(duration * pixelsPerMinute);

    showElement.style.top = `${top}px`;
    showElement.style.height = `${height}px`;

    const timeInfo = document.createElement('div');
    timeInfo.className = 'time-info';
    timeInfo.textContent = `${showStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - ${showEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

    const showInfo = document.createElement('div');
    showInfo.className = 'show-info';
    if (show.name.toLowerCase().includes('hosted by')) {
        const splitName = show.name.split(/(hosted by)/i);
        showInfo.innerHTML = `
            <b>${decodeHtmlEntities(splitName[0].trim())}</b>
            <span class="hosted-by">${decodeHtmlEntities(splitName[1])} ${decodeHtmlEntities(splitName[2])}</span>
        `;
    } else {
        showInfo.innerHTML = `<b>${decodeHtmlEntities(show.name)}</b>`;
    }

    const hoverBox = document.createElement('div');
    hoverBox.className = 'hover-box';
    let showDescription = decodeHtmlEntities(show.description || 'No description available');
    hoverBox.textContent = showDescription;

    // Add hover box to the main container to avoid scrolling issues
    const mainContainer = document.querySelector('.main-container');
    mainContainer.appendChild(hoverBox);

    // Show hover box on mouse enter
    showElement.addEventListener('mouseenter', () => {
        const showRect = showElement.getBoundingClientRect();
        const isMobile = window.innerWidth <= 768;

        // Position relative to the viewport
        hoverBox.style.position = 'fixed';
        hoverBox.style.top = `${showRect.bottom + 5}px`; // Small gap below show
        hoverBox.style.left = isMobile ? `${showRect.left}px` : `${showRect.left + 10}px`;
        hoverBox.style.width = isMobile ? `${showRect.width}px` : '250px';

        // Show immediately without waiting for transitions
        hoverBox.style.transition = 'none';
        hoverBox.style.display = 'block';

        // If it would go off bottom of viewport, show above the show
        const hoverRect = hoverBox.getBoundingClientRect();
        if (hoverRect.bottom > window.innerHeight) {
            hoverBox.style.top = `${showRect.top - hoverRect.height - 5}px`;
        }

        // If it would go off right edge, adjust position
        if (!isMobile && hoverRect.right > window.innerWidth) {
            hoverBox.style.left = `${window.innerWidth - hoverRect.width - 10}px`;
        }
    });

    // Reset transition on mouseleave
    showElement.addEventListener('mouseleave', () => {
        hoverBox.style.display = 'none';
        hoverBox.style.transition = '';
    });

    showElement.appendChild(timeInfo);
    showElement.appendChild(showInfo);

    return showElement;
} 