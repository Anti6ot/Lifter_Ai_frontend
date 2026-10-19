const API_URL = "/api";

const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const messagesContainer = document.getElementById("messages");

let sessionId = localStorage.getItem("sessionId");
if (!sessionId) {
  sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem("sessionId", sessionId);
}

messageInput.addEventListener("input", function() {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
  if (this.value === "") this.style.height = "auto";
});

messageInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", sendMessage);

async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  messageInput.value = "";
  messageInput.style.height = "auto";
  messageInput.disabled = true;
  sendBtn.disabled = true;

  addMessage(text, "user");
  showTypingIndicator();

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: sessionId,
        user_id: "web_client",
        message: text // Отправляем только чистый текст! Бэкенд сам всё извлечет.
      }),
    });

    hideTypingIndicator();

    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);

    const data = await response.json();
    addMessage(data.answer, "ai", data.sources); // Передаем источники

  } catch (err) {
    hideTypingIndicator();
    console.error("Ошибка чата:", err);
    addMessage("⚠️ Произошла ошибка соединения с сервером.", "ai");
  } finally {
    messageInput.disabled = false;
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

function addMessage(text, type, sources = null) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${type}`;
  
  const icon = type === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
  const formattedText = type === 'ai' ? marked.parse(text) : text.replace(/\n/g, '<br>');
  
  msgDiv.innerHTML = `
    <div class="avatar">${icon}</div>
    <div class="bubble">${formattedText}</div>
  `;
  
  // ДОБАВЛЯЕМ ИСТОЧНИКИ, ЕСЛИ ОНИ ЕСТЬ
  if (type === 'ai' && sources && sources.length > 0) {
    const sourcesDiv = document.createElement("div");
    sourcesDiv.className = "source-links";
    sourcesDiv.innerHTML = "<strong>Источники:</strong><br>" + 
      sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">🔗 ${s.title}</a>`).join("<br>");
    
    msgDiv.querySelector('.bubble').appendChild(sourcesDiv);
  }
  
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message ai typing-msg";
  typingDiv.innerHTML = `
    <div class="avatar"><i class="fa-solid fa-robot"></i></div>
    <div class="typing-indicator"><span></span><span></span><span></span></div>
  `;
  typingDiv.id = "typing-indicator";
  messagesContainer.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.getElementById("typing-indicator");
  if (indicator) indicator.remove();
}