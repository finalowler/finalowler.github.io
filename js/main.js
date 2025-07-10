const makeRequest = async (text) => {
    try {
        const response = await fetch("https://joint-sloth-smoothly.ngrok-free.app/query", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: text })
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
};

const setup = () => {
    const form = document.querySelector('#chat-form');
    const input = document.querySelector('.chat-input');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value;
        const headshot = document.querySelector(".headshot");
        headshot.classList.add("hidden");
        document.querySelector('#chat-response').textContent = "Loading...";
        const data = await makeRequest(text);
        const paragraph = document.querySelector('#chat-response');
        const { answer, project } = data;
        const regex = /\[([^\]]+)\]/g;
        const updatedText = answer.replace(regex, (match, p1) => {
            return `<a href="https://linafowler.com/pages/${project}"}" target="_blank">${p1}</a>`;
        });
        headshot.classList.remove("hidden");
        paragraph.innerHTML = updatedText;
    });
};

const hideModal = () => {
    const shadow = document.querySelector(".shadow");
    shadow.classList.add("hidden");
    const modal = document.querySelector(".chat-modal");
    modal.classList.add("hidden");
}

const showModal = () => {
    const shadow = document.querySelector(".shadow");
    shadow.classList.remove("hidden");
    const modal = document.querySelector(".chat-modal");
    modal.classList.remove("hidden");
}

const initTheme = () => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (systemDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
};

const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
};

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
});

const createStarfield = () => {
    const starfield = document.getElementById('starfield');
    const numStars = 100;
    
    // Clear existing stars
    starfield.innerHTML = '';
    
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random size
        const sizes = ['small', 'medium', 'large'];
        const weights = [0.7, 0.25, 0.05]; // Most stars are small
        let randomSize = Math.random();
        let sizeClass = 'small';
        
        if (randomSize > weights[0]) {
            sizeClass = randomSize > weights[0] + weights[1] ? 'large' : 'medium';
        }
        
        star.classList.add(sizeClass);
        
        // Random position
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        
        // Random animation delay
        star.style.animationDelay = Math.random() * 4 + 's';
        
        // Some stars drift slowly
        if (Math.random() < 0.3) {
            star.classList.add('drifting');
            star.style.animationDelay = Math.random() * 20 + 's';
        }
        
        starfield.appendChild(star);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setup();
    createStarfield();
});