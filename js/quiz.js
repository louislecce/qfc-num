/* =============================================
   CULTURATION — Quiz Engine + Progress Tracker
   ============================================= */

/* --- Navbar scroll behaviour --- */
(function () {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

class Quiz {
  constructor(moduleId, questions, theme = 'maquette') {
    this.moduleId   = moduleId;
    this.questions  = questions;
    this.theme      = theme; // 'maquette' | 'tech'
    this.current    = 0;
    this.score      = 0;
    this.answered   = false;
    this.container  = document.getElementById('quiz-container');
    this.results    = document.getElementById('quiz-result');
    this.init();
  }

  init() {
    this.render();
    this.updateProgress();
    this.updateSidebarProgress();
  }

  render() {
    if (this.current >= this.questions.length) {
      this.showResult();
      return;
    }

    const q      = this.questions[this.current];
    const letters = ['A', 'B', 'C', 'D'];
    this.answered = false;

    this.container.innerHTML = `
      <div class="quiz-progress-bar">
        <div class="quiz-progress-fill ${this.theme}" style="width: ${(this.current / this.questions.length) * 100}%"></div>
      </div>

      <div class="quiz-question-block">
        <div class="quiz-question-num">Question ${this.current + 1} sur ${this.questions.length}</div>
        <div class="quiz-question-text">${q.question}</div>
        <div class="quiz-options quiz-${this.theme}">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" data-index="${i}" onclick="quizInstance.select(${i})">
              <span class="option-letter">${letters[i]}</span>
              <span class="option-text">${opt}</span>
            </button>
          `).join('')}
        </div>

        <div class="quiz-feedback" id="quiz-feedback">
          <svg viewBox="0 0 16 16" fill="currentColor" id="feedback-icon"></svg>
          <span id="feedback-text"></span>
        </div>
      </div>

      <div class="quiz-nav">
        <span class="quiz-counter">${this.score} bonne${this.score > 1 ? 's' : ''} réponse${this.score > 1 ? 's' : ''} sur ${this.current}</span>
        <button class="btn btn-primary-${this.theme}" id="btn-next" onclick="quizInstance.next()" disabled>
          ${this.current + 1 < this.questions.length ? 'Question suivante' : 'Voir les résultats'}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </button>
      </div>
    `;
  }

  select(index) {
    if (this.answered) return;
    this.answered = true;

    const q        = this.questions[this.current];
    const options  = this.container.querySelectorAll('.quiz-option');
    const feedback = this.container.querySelector('#quiz-feedback');
    const fbIcon   = this.container.querySelector('#feedback-icon');
    const fbText   = this.container.querySelector('#feedback-text');
    const btnNext  = this.container.querySelector('#btn-next');

    options.forEach(btn => btn.disabled = true);

    if (index === q.correct) {
      this.score++;
      options[index].classList.add('correct');
      feedback.classList.add('show', 'correct');
      fbIcon.innerHTML = '<path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/>';
      fbText.textContent = 'Bonne réponse !';
    } else {
      options[index].classList.add('incorrect');
      options[q.correct].classList.add('correct');
      feedback.classList.add('show', 'incorrect');
      fbIcon.innerHTML = '<path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>';
      fbText.textContent = `Pas tout à fait. La bonne réponse était : "${q.options[q.correct]}"`;
    }

    btnNext.disabled = false;
  }

  next() {
    this.current++;
    if (this.current >= this.questions.length) {
      this.showResult();
    } else {
      this.render();
    }
  }

  showResult() {
    this.container.style.display = 'none';
    this.results.classList.add('show');

    const pct   = Math.round((this.score / this.questions.length) * 100);
    const scoreEl = this.results.querySelector('.quiz-result-score');
    const title   = this.results.querySelector('.quiz-result-title');
    const desc    = this.results.querySelector('.quiz-result-desc');

    scoreEl.textContent = `${this.score}/${this.questions.length}`;

    if (pct >= 80) {
      scoreEl.classList.add('score-great');
      title.textContent = 'Excellente maîtrise !';
      desc.textContent  = `${pct}% de bonnes réponses. Tu as bien assimilé les concepts clés de ce module.`;
      this.saveProgress(true);
    } else if (pct >= 60) {
      scoreEl.classList.add('score-ok');
      title.textContent = 'Bon début !';
      desc.textContent  = `${pct}% de bonnes réponses. Relis les points clés pour consolider ta compréhension.`;
      this.saveProgress(false);
    } else {
      scoreEl.classList.add('score-low');
      title.textContent = 'À retravailler';
      desc.textContent  = `${pct}% de bonnes réponses. Reprends le module avant de retenter le quiz.`;
      this.saveProgress(false);
    }

    this.updateSidebarProgress();
  }

  saveProgress(completed) {
    const data = { completed, score: this.score, total: this.questions.length, date: new Date().toISOString() };
    localStorage.setItem('culturation_' + this.moduleId, JSON.stringify(data));
  }

  retry() {
    this.current  = 0;
    this.score    = 0;
    this.answered = false;
    this.container.style.display = 'block';
    this.results.classList.remove('show');
    const scoreEl = this.results.querySelector('.quiz-result-score');
    scoreEl.className = 'quiz-result-score';
    this.render();
  }

  updateProgress() {
    const data = JSON.parse(localStorage.getItem('culturation_' + this.moduleId) || 'null');
    if (data && data.completed) {
      const banner = document.getElementById('completed-banner');
      if (banner) {
        banner.style.display = 'flex';
        banner.querySelector('.banner-score').textContent = `${data.score}/${data.total}`;
      }
    }
  }

  updateSidebarProgress() {
    document.querySelectorAll('.sidebar-module-list a[data-module]').forEach(link => {
      const id   = link.dataset.module;
      const data = JSON.parse(localStorage.getItem('culturation_' + id) || 'null');
      const check = link.querySelector('.done-check');
      if (data && data.completed && check) {
        check.style.display = 'flex';
      }
    });
  }
}

// Retry button helper
function retryQuiz() { quizInstance.retry(); }

// Go back to top of page
function scrollToQuiz() {
  document.getElementById('quiz-anchor').scrollIntoView({ behavior: 'smooth' });
}
