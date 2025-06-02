document.addEventListener('DOMContentLoaded', function () {
    // Create floating particles
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', function () {
        if (this.checked) {
            document.documentElement.classList.add('light-theme');
            // Change particles color to red
            document.querySelectorAll('.particle').forEach(particle => {
                particle.style.background = 'var(--primary-color)';
            });
        } else {
            document.documentElement.classList.remove('light-theme');
            // Change particles back to original color
            document.querySelectorAll('.particle').forEach(particle => {
                particle.style.background = 'var(--primary-color)';
            });
        }
    });
    createParticles();

    // Check if this is an event view (has hash parameters)
    const hashParams = window.location.hash.substr(1);

    if (hashParams) {
        // This is an event view
        showEventView(hashParams);
    } else {
        // This is the creator view
        showCreatorView();
    }
});

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Random size between 1px and 3px
        const size = Math.random() * 2 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        // Random position
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.top = `${Math.random() * 100}vh`;

        // Random animation duration
        const duration = Math.random() * 20 + 10;
        particle.style.animationDuration = `${duration}s`;

        // Random delay
        particle.style.animationDelay = `${Math.random() * 10}s`;

        particlesContainer.appendChild(particle);
    }
}

function showCreatorView() {
    document.getElementById('creator-view').style.display = 'block';
    document.getElementById('event-view').style.display = 'none';

    // Populate timezones
    populateTimezones();

    // Set default datetime to now + 1 hour
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const datetimeStr = now.toISOString().slice(0, 16);
    document.getElementById('event-date').value = datetimeStr;

    // Set default timezone to user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Use modern timezone name if available
    document.getElementById('timezone').value = userTimezone === 'Asia/Calcutta' ? 'Asia/Kolkata' : userTimezone;

    // Generate button event
    document.getElementById('generate-btn').addEventListener('click', generateLink);

    // Copy button event
    document.getElementById('copy-btn').addEventListener('click', copyLink);

    // Share button event
    document.getElementById('share-btn').addEventListener('click', shareLink);
}

function populateTimezones() {
    const timezoneSelect = document.getElementById('timezone');
    const timezones = Intl.supportedValuesOf('timeZone');

    // Filter and modernize timezone names
    const modernTimezones = timezones.map(tz => {
        if (tz === 'Asia/Calcutta') return 'Asia/Kolkata';
        return tz;
    }).sort();

    modernTimezones.forEach(tz => {
        const option = document.createElement('option');
        option.value = tz;

        // Format timezone for display (remove continent/)
        const displayName = tz.includes('/') ? tz.split('/')[1].replace(/_/g, ' ') : tz;
        option.textContent = displayName;

        timezoneSelect.appendChild(option);
    });
}

function generateLink() {
    const eventTitle = document.getElementById('event-title').value.trim();
    const eventDate = document.getElementById('event-date').value;
    const timezone = document.getElementById('timezone').value;

    if (!eventDate || !timezone) {
        alert('Please fill in all required fields');
        return;
    }

    // Create a unique ID for this event
    const eventId = generateFuturisticId();

    // Create the event data object
    const eventData = {
        t: eventTitle,
        d: eventDate,
        z: timezone
    };

    // Convert to base64 for URL
    const eventDataStr = btoa(JSON.stringify(eventData));

    // Generate the URL (using hash for client-side routing)
    const baseUrl = window.location.href.split('#')[0];
    const eventUrl = `${baseUrl}#${eventId}:${eventDataStr}`;

    // Display the result
    document.getElementById('generated-url').textContent = eventUrl;
    document.getElementById('result-container').style.display = 'block';

    // Generate QR code
    if (document.getElementById('qr-code').hasChildNodes()) {
        document.getElementById('qr-code').innerHTML = '';
    }
    new QRCode(document.getElementById('qr-code'), {
        text: eventUrl,
        width: 180,
        height: 180,
        colorDark: "#00f7ff",
        colorLight: "transparent",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Scroll to result
    document.getElementById('result-container').scrollIntoView({ behavior: 'smooth' });
}

function generateFuturisticId() {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function copyLink() {
    const url = document.getElementById('generated-url').textContent;
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.getElementById('copy-btn');
        btn.textContent = 'COPIED!';
        btn.style.background = 'var(--success-color)';
        setTimeout(() => {
            btn.textContent = 'COPY LINK';
            btn.style.background = 'linear-gradient(135deg, var(--secondary-color), #5e1dc7)';
        }, 2000);
    });
}

function shareLink() {
    const url = document.getElementById('generated-url').textContent;
    const title = document.getElementById('event-title').value || 'TimeZone Link Event';

    if (navigator.share) {
        navigator.share({
            title: title,
            text: 'Check out this event - the time will automatically adjust to your timezone',
            url: url
        }).catch(err => {
            console.log('Error sharing:', err);
        });
    } else {
        // Fallback for browsers that don't support Web Share API
        const shareText = `${title}\n\n${url}\n\nThis smart link will show the event time in your local timezone.`;
        prompt('Copy this link to share:', shareText);
    }
}

function showEventView(hashParams) {
    document.getElementById('creator-view').style.display = 'none';
    document.getElementById('event-view').style.display = 'block';

    // Parse the hash parameters
    const [eventId, eventDataStr] = hashParams.split(':');
    if (!eventId || !eventDataStr) {
        document.getElementById('display-event-title').textContent = 'INVALID LINK';
        document.getElementById('display-event-time').textContent = 'This appears to be a malformed TimeZone Link.';
        return;
    }

    try {
        // Decode the event data
        const eventData = JSON.parse(atob(eventDataStr));

        // Get the original date and timezone (using modern name)
        const originalTimezone = eventData.z === 'Asia/Calcutta' ? 'Asia/Kolkata' : eventData.z;
        
        // Create date object properly accounting for timezone
        const dateString = eventData.d.includes('Z') ? eventData.d : eventData.d + 'Z';
        const originalDate = new Date(dateString);

        // Format the original time
        const originalTimeStr = formatFuturisticDateTime(originalDate, originalTimezone);

        // Get viewer's timezone and convert time
        const viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const viewerTimeStr = formatFuturisticDateTime(originalDate, viewerTimezone, originalTimezone);

        // Display the event
        document.getElementById('display-event-title').textContent = eventData.t || 'TIMEZONE EVENT';
        document.getElementById('display-event-time').textContent = viewerTimeStr.formatted.toUpperCase();
        document.getElementById('original-timezone').textContent = `(Originally scheduled for ${originalTimeStr.formatted} ${originalTimeStr.timezoneAbbr})`;
        document.getElementById('your-timezone').textContent = `Displayed in your detected timezone: ${viewerTimezone} (${viewerTimeStr.timezoneAbbr})`;

        // Set up calendar buttons
        setupCalendarButtons(eventData.t || 'Event', originalDate, originalTimezone);

        // Generate QR code for this event
        if (document.getElementById('event-qr-code').hasChildNodes()) {
            document.getElementById('event-qr-code').innerHTML = '';
        }
        new QRCode(document.getElementById('event-qr-code'), {
            text: window.location.href,
            width: 180,
            height: 180,
            colorDark: "#00f7ff",
            colorLight: "transparent",
            correctLevel: QRCode.CorrectLevel.H
        });

    } catch (e) {
        console.error('Error parsing event data:', e);
        document.getElementById('display-event-title').textContent = 'LINK ERROR';
        document.getElementById('display-event-time').textContent = 'Could not parse event data.';
    }
}

function formatFuturisticDateTime(date, timezone, originalTimezone = null) {
    // Ensure we're working with a valid date
    if (isNaN(date.getTime())) {
        return { formatted: 'INVALID DATE', timezoneAbbr: 'ERR' };
    }

    const options = {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    let weekday, month, day, year, hour, minute, dayPeriod;
    for (const part of parts) {
        switch (part.type) {
            case 'weekday': weekday = part.value; break;
            case 'month': month = part.value; break;
            case 'day': day = part.value; break;
            case 'year': year = part.value; break;
            case 'hour': hour = part.value; break;
            case 'minute': minute = part.value; break;
            case 'dayPeriod': dayPeriod = part.value; break;
        }
    }

    // Get timezone abbreviation
    const timezoneAbbr = getTimezoneAbbr(timezone, date);

    // Format the string in a futuristic way
    const formatted = `${month} ${day}, ${hour}:${minute} ${dayPeriod}`;

    return { formatted, timezoneAbbr };
}

function getTimezoneAbbr(timezone, date) {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            timeZoneName: 'short'
        });
        const parts = formatter.formatToParts(date);
        const timezoneNamePart = parts.find(part => part.type === 'timeZoneName');
        return timezoneNamePart ? timezoneNamePart.value : timezone.split('/').pop().substr(0, 3).toUpperCase();
    } catch (e) {
        return timezone.split('/').pop().substr(0, 3).toUpperCase();
    }
}

function setupCalendarButtons(title, date, timezone) {
    // Format date for calendar links
    const startTime = formatDateForCalendar(date, timezone);
    const endTime = formatDateForCalendar(new Date(date.getTime() + 3600000), timezone); // +1 hour

    // Google Calendar link
    const googleCalUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime}/${endTime}&ctz=${encodeURIComponent(timezone)}`;
    document.getElementById('google-cal-btn').href = googleCalUrl;

    // Outlook Calendar link
    const outlookCalUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${startTime}&enddt=${endTime}`;
    document.getElementById('outlook-cal-btn').href = outlookCalUrl;

    // Apple Calendar link (this is a simple ICS file download)
    document.getElementById('apple-cal-btn').addEventListener('click', (e) => {
        e.preventDefault();
        downloadICS(title, date, timezone);
    });
}

function formatDateForCalendar(date, timezone) {
    // Format as YYYYMMDDTHHmmss
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    let year, month, day, hour, minute, second;
    for (const part of parts) {
        switch (part.type) {
            case 'year': year = part.value; break;
            case 'month': month = part.value; break;
            case 'day': day = part.value; break;
            case 'hour': hour = part.value; break;
            case 'minute': minute = part.value; break;
            case 'second': second = part.value; break;
        }
    }

    return `${year}${month}${day}T${hour}${minute}${second}`;
}

function downloadICS(title, date, timezone) {
    const startTime = formatDateForICS(date, timezone);
    const endTime = formatDateForICS(new Date(date.getTime() + 3600000), timezone); // +1 hour

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:${title}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'event.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function formatDateForICS(date, timezone) {
    // Format as YYYYMMDDTHHmmssZ
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
    };

    // Convert to UTC first
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(utcDate);

    let year, month, day, hour, minute, second;
    for (const part of parts) {
        switch (part.type) {
            case 'year': year = part.value; break;
            case 'month': month = part.value; break;
            case 'day': day = part.value; break;
            case 'hour': hour = part.value; break;
            case 'minute': minute = part.value; break;
            case 'second': second = part.value; break;
        }
    }

    return `${year}${month}${day}T${hour}${minute}${second}Z`;
}