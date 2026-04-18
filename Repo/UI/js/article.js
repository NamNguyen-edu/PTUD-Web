// ==========================
// ARTICLE COMPONENT
// ==========================

function createArticle(data) {
  return `
    <div class="article-component">

      <div class="article-content">
        <div class="meta">${data.category} • ${data.time}</div>

        <h3 class="title">${data.title}</h3>

        <p class="desc">${data.desc}</p>

        <div class="bottom">
          <div class="tags">
            ${data.tags.map(tag => `<span>${tag}</span>`).join("")}
          </div>

          <div class="vote-box">
            <span class="vote up">▲ ${data.up}</span>
            <span class="vote down">▼ ${data.down}</span>
          </div>
        </div>
      </div>

      <div class="article-thumb"></div>

    </div>
  `;
}


// ==========================
// FULL ARTICLE DETAIL
// ==========================

function renderArticle(data) {
  return `
    <div class="article-container">

      <div class="category">${data.category}</div>

      <h1 class="article-title">${data.title}</h1>

      <div class="meta">${data.author} • ${data.time}</div>

      <div class="article-image"></div>

      <div class="tags">
        ${data.tags.map(t => `<span>${t}</span>`).join("")}
      </div>

      <div class="article-content">
        ${data.content.map(p => `<p>${p}</p>`).join("")}
      </div>

      <div class="vote-box">
        <span class="vote up">▲ ${data.up}</span>
        <span class="vote down">▼ ${data.down}</span>
      </div>

    </div>
  `;
}