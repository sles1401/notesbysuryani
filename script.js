document.addEventListener('DOMContentLoaded', () => {
  // 1. Scroll reveal animation
  const revealElements = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  } else {
    const staggerContainers = document.querySelectorAll(
      '.pillars-grid, .notes-grid'
    );
    staggerContainers.forEach((container) => {
      const cards = container.querySelectorAll('.reveal');
      cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 90}ms`;
      });
    });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  // 2. Ruang Singgah: Ambil satu catatan untuk hari ini
  const drawBtn = document.getElementById('btn-draw-note');
  const copyBtn = document.getElementById('btn-copy-note');
  const noteNumEl = document.getElementById('draw-note-num');
  const noteTextEl = document.getElementById('draw-note-text');
  const noteCaptionEl = document.getElementById('draw-note-caption');
  const copyFeedbackEl = document.getElementById('copy-feedback');

  if (drawBtn && noteTextEl && noteCaptionEl && noteNumEl) {
    const curatedNotes = [
      {
        num: 'Lembar No. 01',
        quote: '“Coba satu hari lagi.”',
        caption: 'Kamu tidak harus menyelesaikan semuanya hari ini.',
      },
      {
        num: 'Lembar No. 02',
        quote: '“Setiap jiwa punya musim mekarnya sendiri.”',
        caption: 'Tidak perlu terburu-buru hanya karena orang lain terlihat lebih cepat.',
      },
      {
        num: 'Lembar No. 03',
        quote: '“Attend. Aku tahu satu kata, yaitu hadir—hadirlah kapan pun.”',
        caption: 'Kehadiran yang pelan jauh lebih jujur daripada kesibukan yang kosong.',
      },
      {
        num: 'Lembar No. 04',
        quote: '“Silent growth is still growth.”',
        caption: 'Akar selalu tumbuh di tempat yang paling sunyi sebelum daun terlihat.',
      },
      {
        num: 'Lembar No. 05',
        quote: '“Boleh berhenti sebentar. Dunia tidak akan runtuh hanya karena kamu menarik napas.”',
        caption: 'Izin untuk beristirahat tanpa rasa bersalah.',
      },
      {
        num: 'Lembar No. 06',
        quote: '“Tidak semua hal harus dijawab hari ini; sebagian cukup diterima dengan pelan.”',
        caption: 'Tentang belajar cukup di tengah hal-hal yang di luar kendali.',
      },
      {
        num: 'Lembar No. 07',
        quote: '“Kadang bentuk keberanian paling sunyi adalah tetap lembut setelah hari yang panjang.”',
        caption: 'Untuk kamu yang masih berusaha berbaik hati pada diri sendiri.',
      },
      {
        num: 'Lembar No. 08',
        quote: '“Pelan bukan berarti berhenti. Ia hanya cara lain untuk sampai dengan utuh.”',
        caption: 'Ritme setiap orang berbeda, dan itu tidak apa-apa.',
      },
    ];

    let currentIndex = 0;

    drawBtn.addEventListener('click', () => {
      let nextIndex = Math.floor(Math.random() * curatedNotes.length);
      if (nextIndex === currentIndex) {
        nextIndex = (currentIndex + 1) % curatedNotes.length;
      }
      currentIndex = nextIndex;
      const picked = curatedNotes[currentIndex];

      if (copyFeedbackEl) {
        copyFeedbackEl.textContent = '';
      }

      noteTextEl.classList.add('is-fading');
      noteCaptionEl.classList.add('is-fading');

      window.setTimeout(() => {
        noteNumEl.textContent = picked.num;
        noteTextEl.textContent = picked.quote;
        noteCaptionEl.textContent = picked.caption;
        noteTextEl.classList.remove('is-fading');
        noteCaptionEl.classList.remove('is-fading');
      }, 220);
    });

    if (copyBtn && copyFeedbackEl) {
      copyBtn.addEventListener('click', async () => {
        const textToCopy = `${noteTextEl.textContent} — @notesbysuryani`;
        try {
          await navigator.clipboard.writeText(textToCopy);
          copyFeedbackEl.textContent = 'Kalimat tersalin. Semoga menemani harimu.';
        } catch {
          copyFeedbackEl.textContent = 'Tidak dapat menyalin otomatis di browser ini.';
        }
      });
    }
  }

  // 3. Ruang Singgah: Jejak Singgah (Kotak Pesan Pembaca — Supabase + fallback localStorage)
  const guestbookForm = document.getElementById('guestbook-form');
  const guestbookList = document.getElementById('guestbook-list');
  const guestbookSubmit = document.getElementById('guestbook-submit');
  const guestbookStatus = document.getElementById('guestbook-status');

  if (guestbookForm && guestbookList) {
    const STORAGE_KEY = 'notesbysuryani_guestbook_v1';
    const config = window.NOTES_CONFIG || {};
    const supabaseUrl = (config.supabaseUrl || '').trim().replace(/\/+$/, '');
    const supabaseKey = (config.supabaseAnonKey || '').trim();
    const useSupabase = Boolean(supabaseUrl && supabaseKey);
    const buildHeaders = (extra = {}) => {
      const headers = { apikey: supabaseKey, ...extra };
      if (!supabaseKey.startsWith('sb_publishable_')) {
        headers.Authorization = `Bearer ${supabaseKey}`;
      }
      return headers;
    };

    const defaultEntries = [
      {
        author: 'Catatan Pembuka',
        date: 'Ruang Singgah',
        message:
          'Terima kasih sudah mampir. Semoga hari ini terasa sedikit lebih ringan dari kemarin.',
      },
    ];

    const formatDate = (isoString) => {
      if (!isoString) return '';
      const parsed = new Date(isoString);
      if (Number.isNaN(parsed.getTime())) return isoString;
      return parsed.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    };

    const loadLocalEntries = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultEntries;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0
          ? parsed
          : defaultEntries;
      } catch {
        return defaultEntries;
      }
    };

    const loadSupabaseEntries = async () => {
      try {
        const endpoint = `${supabaseUrl}/rest/v1/guestbook?select=id,author,message,created_at&order=created_at.desc&limit=30`;
        const response = await fetch(endpoint, {
          headers: buildHeaders(),
        });
        if (!response.ok) throw new Error('Gagal memuat pesan');
        const rows = await response.json();
        if (!Array.isArray(rows) || rows.length === 0) return defaultEntries;
        return rows.map((row) => ({
          author: row.author,
          date: formatDate(row.created_at),
          message: row.message,
        }));
      } catch {
        return defaultEntries;
      }
    };

    const renderEntries = (entries) => {
      guestbookList.innerHTML = '';
      entries.forEach((entry) => {
        const item = document.createElement('article');
        item.className = 'guestbook-item';

        const meta = document.createElement('div');
        meta.className = 'guestbook-meta';

        const author = document.createElement('span');
        author.className = 'guestbook-author';
        author.textContent = entry.author || 'Seseorang yang singgah';

        const date = document.createElement('span');
        date.textContent = entry.date || '';

        meta.appendChild(author);
        meta.appendChild(date);

        const body = document.createElement('p');
        body.className = 'guestbook-text';
        body.textContent = entry.message;

        item.appendChild(meta);
        item.appendChild(body);
        guestbookList.appendChild(item);
      });
    };

    let entries = defaultEntries;

    if (useSupabase) {
      loadSupabaseEntries().then((rows) => {
        entries = rows;
        renderEntries(entries);
      });
    } else {
      entries = loadLocalEntries();
      renderEntries(entries);
      if (guestbookStatus) {
        guestbookStatus.textContent =
          'Mode lokal aktif (isi config.js dengan Supabase agar pesan tampil untuk semua pengunjung).';
      }
    }

    guestbookForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const nameInput = document.getElementById('visitor-name');
      const messageInput = document.getElementById('visitor-message');

      const message = messageInput.value.trim();
      if (!message) return;

      const author = nameInput.value.trim() || 'Seseorang yang singgah';

      if (useSupabase) {
        if (guestbookSubmit) guestbookSubmit.disabled = true;
        if (guestbookStatus) guestbookStatus.textContent = 'Mengirim pesan...';

        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/guestbook`, {
            method: 'POST',
            headers: buildHeaders({
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            }),
            body: JSON.stringify({ author, message }),
          });

          if (!response.ok) throw new Error('Gagal mengirim pesan');
          const inserted = await response.json();
          const newEntry = Array.isArray(inserted) && inserted[0]
            ? {
                author: inserted[0].author,
                date: formatDate(inserted[0].created_at),
                message: inserted[0].message,
              }
            : {
                author,
                date: formatDate(new Date().toISOString()),
                message,
              };

          entries = [newEntry, ...entries.filter((e) => e.date !== 'Ruang Singgah')];
          renderEntries(entries);
          guestbookForm.reset();
          if (guestbookStatus) {
            guestbookStatus.textContent = 'Terima kasih, pesanmu sudah dititipkan.';
          }
        } catch {
          if (guestbookStatus) {
            guestbookStatus.textContent =
              'Maaf, pesan belum berhasil terkirim. Coba beberapa saat lagi.';
          }
        } finally {
          if (guestbookSubmit) guestbookSubmit.disabled = false;
        }
        return;
      }

      const dateLabel = formatDate(new Date().toISOString());
      entries = [{ author, date: dateLabel, message }, ...entries].slice(0, 20);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch {
        // Ignore storage quota errors silently
      }

      renderEntries(entries);
      guestbookForm.reset();
    });
  }
});
