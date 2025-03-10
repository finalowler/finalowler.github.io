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

document.addEventListener('DOMContentLoaded', setup);