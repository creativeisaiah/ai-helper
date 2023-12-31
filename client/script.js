import bot from './assets/bot.svg';
import user from './assets/user.svg';

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let loadInterval;

function escapeHTML(unsafeText) {
  let div = document.createElement('div');
  div.textContent = unsafeText;
  return div.innerHTML;
}


function loader(element){
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if(element.textContent === '....'){
      element.textContent = '';
    }
  }, 300)
}

function typeText(element, text, callback) {
  let index = 0;

  let interval = setInterval(() => {
    if(index < text.length) {
      element.innerHTML += text.charAt(index);
      index++;

      // Scroll after every character added
      callback();

    } else {
      clearInterval(interval);
    }
  }, 20)
}


function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function scrollSmoothToBottom () {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}


function chatStripe (isAi, value, uniqueId) {
  let escapedValue = escapeHTML(value);
  return (
    `
    <div class="wrapper ${isAi && 'ai'}">
      <div class="chat">
        <div class="profile">
          <img
            src="${isAi ? bot : user}"
            alt="${isAi ? 'bot' : 'user'}"
            />
        </div>
        <div class="message" id=${uniqueId}>${escapedValue}</div>
      </div>
    </div>
    `
  )
}

const welcomeMessage = document.getElementById('intro-message');

let conversationHistory = '';

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

    // Hide the welcome message
    welcomeMessage.style.display = 'none';


  // user's chat stripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

  // Append the user's prompt to the conversation history
  conversationHistory += `User: ${data.get('prompt')}\n`;

  form.reset();

  //bot's chatstripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  //fetch data from server -> bots response
  const response = await fetch('https://ai-helper-5one.onrender.com/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt: conversationHistory
    })
  })

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if(response.ok){
    const data = await response.json();
    const parsedData = data.bot.trim();

    // Check if the response is code
    if (parsedData.startsWith('`') && parsedData.endsWith('`')) {
      // If it is, strip the backticks and format it as code
      parsedData = '<pre class="code-block">' + sanitizeHTML(parsedData.slice(1, -1)) + '</pre>';
    }

    // Append the bot's response to the conversation history
    conversationHistory += `${parsedData}\n`;

    typeText(messageDiv, parsedData, scrollSmoothToBottom);

    setTimeout(() => scrollSmoothToBottom(uniqueId), 20 * parsedData.length);
  } else {
    const err = await response.text()

    messageDiv.innerHTML = "Something went wrong"
    alert(err)
  }
}


form.addEventListener('submit', (e) => {
  handleSubmit(e);

  const textarea = document.querySelector('textarea');
  if(window.matchMedia('(max-width: 768px)').matches) {
    textarea.blur();
  }
});

form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);

    const textarea = document.querySelector('textarea');
    if(window.matchMedia('(max-width: 768px)').matches) {
      textarea.blur();
    }
  }
});