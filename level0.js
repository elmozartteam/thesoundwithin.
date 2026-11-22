/* THE SOUND WITHIN · SOUNDPATH LEVEL 0
   Reading / Listening / Speaking, interactive note maps, pitch exercises and microphone matching.
   Audio is routed through instruments.js (SoundFont samples where available). */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const natural = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const pitchClassNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  const naturalPitchClasses = [0, 2, 4, 5, 7, 9, 11];
  const sessions = { reading: 5, listening: 5, speaking: 3 };
  let currentMode = 'reading';
  let session = null;
  let previousMidi = null;
  let activeMicStream = null;
  let audioContext = null;
  let activeHandles = [];

  function noteName(midi) {
    const octave = Math.floor(midi / 12) - 1;
    return pitchClassNames[((midi % 12) + 12) % 12] + octave;
  }

  function playNote(midi, instrument = 'piano', duration = 1.7) {
    try {
      if (window.TSWAudio && typeof window.TSWAudio.note === 'function') {
        const handle = window.TSWAudio.note(instrument, midi, { dur: duration, vel: 0.78 });
        if (handle) activeHandles.push(handle);
        return true;
      }
    } catch (error) {
      console.warn('TSW instrument audio unavailable:', error);
    }
    setAudioStatus('Audio instrumen belum siap. Periksa koneksi internet dan coba lagi.');
    return false;
  }

  function stopLessonAudio() {
    activeHandles.forEach(handle => {
      try { if (handle && typeof handle.stop === 'function') handle.stop(0.08); } catch (_) {}
    });
    activeHandles = [];
    if (window.TSWInstruments && typeof window.TSWInstruments.stopAll === 'function') {
      try { window.TSWInstruments.stopAll(); } catch (_) {}
    }
    if (window.TSWAudio && typeof window.TSWAudio.stop === 'function') {
      try { window.TSWAudio.stop(); } catch (_) {}
    }
  }

  function setAudioStatus(message) {
    const status = $('tsxStatus') || $('instrumentAudioStatus');
    if (status) status.textContent = message;
  }

  function setNoteReadout(midi) {
    const readout = $('pnNote');
    if (readout) readout.textContent = noteName(midi);
  }

  /* Per-unit learning guide: all 17 instructional elements from the TSW master development brief. */
  const lessonGuides = {
    'unit-01': {
      objectives: ['Menjelaskan perbedaan pitch, duration, dynamics, timbre, dan tempo.', 'Membedakan melody dan harmony melalui contoh bunyi.'],
      concept: 'Musik mengatur bunyi dan keheningan di dalam waktu. Kita dapat mengamatinya melalui karakter bunyi, susunan nada, serta hubungan antarbagian musik.',
      fundamentals: ['Pitch: kesan tinggi atau rendahnya nada.', 'Duration: berapa lama bunyi berlangsung.', 'Dynamics: tingkat keras atau lembut.', 'Timbre: warna khas sumber bunyi.', 'Tempo dan rhythm: laju serta susunan ketukan dan jeda.'],
      theory: 'Satu peristiwa bunyi dapat memiliki beberapa sifat sekaligus. Contohnya, satu nada piano dapat memiliki pitch tertentu, dimainkan dengan volume lembut, ditahan selama dua detik, dan tetap memiliki timbre khas piano.',
      visual: 'Gelombang suara di halaman ini merupakan model visual sederhana. Diagram tidak menggambarkan seluruh kompleksitas gelombang akustik atau cara telinga memproses suara.',
      examples: 'Bandingkan satu nada C4 pada piano, gitar, dan biola. Nama nada dan target pitch-nya sama, tetapi serangan bunyi, peluruhan, dan warna suaranya berbeda.',
      interaction: 'Gunakan tombol Piano, Gitar, dan Biola pada demonstrasi di atas. Mainkan satu nada yang sama dan dengarkan perbedaan karakter suaranya.',
      reading: 'Baca kembali definisi pitch, duration, dynamics, timbre, melody, dan harmony. Coba jelaskan satu contoh untuk setiap istilah dengan kalimatmu sendiri.',
      listening: 'Dengarkan satu nada dari tiga instrumen. Catat mana yang terdengar lebih tajam, lembut, panjang, atau pendek tanpa menyamakan sifat tersebut dengan pitch.',
      speaking: 'Ucapkan atau humming satu nada nyaman, lalu ulangi dengan volume lebih lembut. Amati bahwa volume dapat berubah tanpa harus sengaja mengganti nada.',
      application: 'Penyanyi menggunakan suara; gitaris memetik senar; pemain biola menggesek senar; drummer memukul membran atau cymbal. Semua menghasilkan bunyi dengan karakter masing-masing.',
      mistakes: 'Jangan menyamakan pitch dengan volume. Bunyi keras tidak otomatis bernada tinggi. Jangan pula menganggap semua bunyi yang berurutan otomatis membentuk melodi yang jelas.',
      exercise: 'Pilih satu lagu yang kamu kenal. Temukan bagian melodi, bagian pengiring, dan satu perbedaan timbre yang kamu dengar.',
      check: 'Jika piano dan gitar memainkan C4, apakah pitch-nya harus berbeda? Jawaban: tidak. Timbre dapat berbeda meskipun pitch target sama.',
      summary: 'Musik dapat diamati melalui unsur bunyi, susunan nada, keheningan, dan karakter sumber suara.',
      completion: 'Kamu siap lanjut jika dapat menjelaskan minimal empat unsur bunyi dan membedakan melodi dari harmoni dengan contoh.'
    },
    'unit-02': {
      objectives: ['Menyebutkan tujuh nama nada natural berurutan.', 'Menjelaskan bahwa urutan nama nada berulang setelah B.'],
      concept: 'Musical alphabet adalah sistem penamaan nada menggunakan huruf A sampai G. Dalam urutan yang dipakai pada materi ini, pembelajaran dimulai dari C: C–D–E–F–G–A–B.',
      fundamentals: ['C, D, E, F, G, A, B adalah tujuh nama natural.', 'Setelah B, urutan kembali ke C.', 'Natural notes ditulis tanpa tanda sharp atau flat.'],
      theory: 'Nama huruf yang sama dapat muncul pada octave berbeda. Karena itu, C4 dan C5 sama-sama bernama C, tetapi tidak menunjukkan tinggi bunyi yang sama.',
      visual: 'Urutan huruf pada diagram adalah siklus. Panah dari B ke C menunjukkan pengulangan nama, bukan berarti kembali ke frekuensi atau posisi bunyi yang persis sama.',
      examples: 'C–D–E–F–G–A–B–C. Coba sebutkan urutan tersebut maju dan mundur.',
      interaction: 'Tekan tombol C sampai B pada natural-note pad untuk mendengar contoh nada.',
      reading: 'Lengkapi urutan: C, D, __, F, __, A, B. Jawaban: E dan G.',
      listening: 'Dengarkan nada C4, D4, dan E4. Perhatikan bahwa nama nada berubah mengikuti urutan natural.',
      speaking: 'Nyanyikan atau ucapkan nama nada C–D–E–F–G–A–B dengan tempo nyaman. Fokus pada urutan, bukan kecepatan.',
      application: 'Pemain gitar, bass, biola, flute, penyanyi, dan pemain keyboard menggunakan nama nada yang sama, meskipun posisi atau teknik produksinya berbeda.',
      mistakes: 'Jangan melanjutkan alfabet menjadi H. Dalam sistem penamaan nada dasar ini, setelah G urutan kembali ke A.',
      exercise: 'Sebutkan nama nada setelah F, setelah A, dan setelah B tanpa melihat diagram.',
      check: 'Apa nama nada setelah B? Jawaban: C pada octave berikutnya.',
      summary: 'Tujuh nama nada natural menjadi dasar untuk membaca dan membicarakan pitch.',
      completion: 'Kamu siap lanjut jika dapat menyebutkan tujuh nama nada tanpa bantuan dan menjelaskan pengulangan setelah B.'
    },
    'unit-03': {
      objectives: ['Mengenali pola tuts putih dan hitam.', 'Menemukan C dengan menggunakan kelompok dua tuts hitam.'],
      concept: 'Pola keyboard tersusun berulang sehingga pemain dapat menemukan nada berdasarkan bentuk kelompok tuts hitam, bukan dengan menghafal seluruh keyboard satu per satu.',
      fundamentals: ['Tuts putih mewakili natural notes.', 'Tuts hitam berada di antara beberapa tuts putih.', 'Kelompok hitam bergantian dua dan tiga.', 'Tuts putih di kiri kelompok dua tuts hitam adalah C.'],
      theory: 'Satu octave pada keyboard standar mencakup tujuh tuts putih dan lima tuts hitam. Pola dua dan tiga tuts hitam menjadi penanda visual yang berulang.',
      visual: 'Keyboard interaktif menampilkan dua octave. Tuts C dan F diberi label sebagai penanda awal pola.',
      examples: 'Cari kelompok dua tuts hitam di bagian tengah keyboard. Tuts putih tepat di kirinya adalah C; bergerak ke kanan, kamu akan menemukan D dan E.',
      interaction: 'Tekan tuts putih dan hitam pada keyboard virtual. Amati label nada saat tuts dimainkan.',
      reading: 'Tunjuk posisi C, F, dan B pada diagram. Jelaskan bagaimana kelompok tuts hitam membantu menemukannya.',
      listening: 'Mainkan C4, lalu C5. Dengarkan hubungan octave. Kemudian mainkan C4 dan D4 untuk mendengar dua nama nada berbeda.',
      speaking: 'Setelah mendengar C4, humming nada yang sama. Gunakan suara nyaman; tidak perlu meniru volume piano.',
      application: 'Keyboard fisik memiliki ukuran berbeda, tetapi pola tuts yang berulang tetap sama. Instrumen lain tidak memakai susunan tuts, tetapi tetap menggunakan nama pitch yang sama.',
      mistakes: 'Jangan mengira setiap tuts hitam selalu memiliki satu nama saja. Nama sharp dan flat akan dipelajari lebih jauh pada level berikutnya.',
      exercise: 'Temukan semua C pada keyboard virtual. Lalu temukan F yang berada di sebelah kiri kelompok tiga tuts hitam.',
      check: 'Apa petunjuk visual paling mudah untuk menemukan C? Jawaban: tuts putih tepat di sebelah kiri kelompok dua tuts hitam.',
      summary: 'Pola keyboard membantu menghubungkan nama nada dengan posisi fisik.',
      completion: 'Kamu siap lanjut jika dapat menemukan C dan F pada beberapa octave tanpa menghitung semua tuts.'
    },
    'unit-04': {
      objectives: ['Membedakan pitch dari volume.', 'Menjelaskan hubungan umum frekuensi dan pitch.', 'Memahami hubungan octave 2:1.'],
      concept: 'Pitch adalah kesan tinggi atau rendahnya nada. Frekuensi adalah jumlah siklus getaran per detik dan diukur dalam hertz (Hz).',
      fundamentals: ['Frekuensi lebih tinggi umumnya terdengar sebagai pitch lebih tinggi.', 'Frekuensi lebih rendah umumnya terdengar sebagai pitch lebih rendah.', 'Volume berkaitan dengan amplitudo, bukan nama nada.', 'Octave menghubungkan dua nada bernama sama pada register berbeda.'],
      theory: 'Dalam sistem equal temperament, frekuensi nada satu octave di atas adalah dua kali frekuensi nada awal. Contoh pendekatan: A4 = 440 Hz dan A5 = 880 Hz.',
      visual: 'Gelombang pada ilustrasi memperlihatkan jumlah siklus berbeda dalam rentang waktu yang sama. Diagram ini konseptual dan bukan pengukuran sinyal audio.',
      examples: 'Bandingkan C4 dan C5. Nama hurufnya sama, tetapi C5 memiliki frekuensi dua kali C4 dalam sistem temperamen sama.',
      interaction: 'Tekan tombol C4 dan C5 pada contoh audio. Coba dengarkan perbedaan register.',
      reading: 'Jelaskan mengapa suara yang lebih keras tidak selalu lebih tinggi pitch-nya.',
      listening: 'Dengarkan pasangan nada rendah dan tinggi. Pilih arah perubahan pitch tanpa melihat nama nada.',
      speaking: 'Humming satu nada lalu coba humming satu octave lebih tinggi jika nyaman. Jangan memaksakan rentang suara.',
      application: 'Penyanyi mengenali rentang vokal; pemain bass sering memainkan register rendah; flute dan biola dapat memainkan register lebih tinggi.',
      mistakes: 'Jangan menganggap angka Hz adalah ukuran volume. Hz menunjukkan frekuensi, sedangkan volume dipengaruhi amplitudo dan persepsi keras-lembut.',
      exercise: 'Bandingkan A4 dan A5 secara audio. Perkirakan hubungan frekuensinya.',
      check: 'Jika A4 sekitar 440 Hz, berapa frekuensi A5 satu octave di atasnya? Jawaban: sekitar 880 Hz.',
      summary: 'Pitch berkaitan dengan frekuensi; octave menghubungkan nama nada yang sama pada register berbeda.',
      completion: 'Kamu siap lanjut jika dapat membedakan pitch dan volume serta menjelaskan rasio octave 2:1.'
    },
    'unit-05': {
      objectives: ['Mengenali keluarga instrumen berdasarkan cara produksi bunyi.', 'Memberi contoh instrumen string, wind, percussion, keyboard, dan voice.'],
      concept: 'Instrumen dapat dikelompokkan menurut sumber getaran atau mekanisme produksi bunyi. Klasifikasi membantu kita membandingkan karakter dan cara memainkan instrumen.',
      fundamentals: ['Strings: senar bergetar.', 'Winds: kolom udara bergetar.', 'Percussion: permukaan atau benda bergetar karena dipukul/digoyang.', 'Keyboard: tuts mengendalikan mekanisme atau sumber suara.', 'Voice: pita suara menghasilkan bunyi.'],
      theory: 'Satu keluarga dapat memiliki teknik dan bentuk instrumen yang sangat beragam. Gitar dan biola sama-sama memakai senar, tetapi gitar biasanya dipetik sedangkan biola digesek.',
      visual: 'Kartu keluarga instrumen adalah ilustrasi kategorisasi. Beberapa instrumen dapat masuk klasifikasi yang lebih khusus menurut sistem organologi.',
      examples: 'Gitar dan biola: strings. Flute dan saxophone: winds. Snare dan cymbal: percussion. Piano: keyboard instrument.',
      interaction: 'Buka studio instrumen dan pilih piano, gitar, biola, atau drum. Perhatikan bagian yang disentuh atau digerakkan untuk menghasilkan suara.',
      reading: 'Cocokkan setiap instrumen dengan keluarga yang sesuai.',
      listening: 'Dengarkan piano, gitar, biola, dan drum. Coba identifikasi sumber bunyi berdasarkan karakter dan serangannya.',
      speaking: 'Gunakan suara sebagai instrumen: humming menghasilkan nada tanpa kata-kata.',
      application: 'Konsep keluarga instrumen berguna bagi semua musisi untuk memahami sumber bunyi dan memilih teknik latihan yang tepat.',
      mistakes: 'Jangan mengelompokkan instrumen hanya berdasarkan bentuk luar. Perhatikan bagaimana sumber getaran menghasilkan bunyi.',
      exercise: 'Pilih tiga instrumen yang kamu kenal. Tuliskan keluarga dan cara bunyinya dihasilkan.',
      check: 'Biola termasuk keluarga apa? Jawaban: strings, karena bunyinya berasal dari getaran senar.',
      summary: 'Instrumen berbeda dalam bentuk dan teknik, tetapi dapat dipahami melalui sumber getarannya.',
      completion: 'Kamu siap lanjut jika dapat mengelompokkan minimal empat instrumen dengan alasan yang tepat.'
    },
    'unit-06': {
      objectives: ['Menjelaskan sumber getaran pada piano, gitar, biola, drum, dan suara manusia.', 'Menghubungkan sumber getaran dengan timbre.'],
      concept: 'Bunyi muncul ketika suatu sumber bergetar dan getaran tersebut merambat melalui medium seperti udara. Instrumen mengubah energi gerak menjadi getaran dengan cara yang berbeda.',
      fundamentals: ['Piano: palu memukul senar.', 'Gitar: senar dipetik.', 'Biola: senar digesek oleh bow.', 'Drum: membran atau permukaan dipukul.', 'Suara manusia: pita suara bergetar karena aliran udara.'],
      theory: 'Bentuk, bahan, resonansi, cara memulai bunyi, dan cara bunyi mereda memengaruhi timbre. Karena itu, dua instrumen dapat memainkan pitch sama tetapi tetap terdengar berbeda.',
      visual: 'Diagram alur menunjukkan urutan sederhana energi, getaran, gelombang suara, dan pendengaran. Ini adalah model pengantar, bukan representasi lengkap akustik.',
      examples: 'Nada E4 pada piano dan biola dapat memiliki frekuensi dasar yang sama, tetapi bunyi biola dapat bertahan dan berubah selama bow digerakkan.',
      interaction: 'Bandingkan sampel piano, gitar, dan biola dari tombol demo. Coba ulangi dengan nada target yang sama.',
      reading: 'Jelaskan bagian mana yang bergetar pada gitar, biola, dan drum.',
      listening: 'Dengarkan onset dan decay tiap instrumen: apakah bunyi langsung muncul, bertahan, atau mereda?',
      speaking: 'Humming satu nada secara stabil dan rasakan bahwa sumber bunyinya berasal dari tubuhmu sendiri.',
      application: 'Pemahaman produksi bunyi membantu musisi memilih teknik artikulasi, kontrol sustain, dan cara latihan yang sesuai.',
      mistakes: 'Jangan menyebut semua contoh sebagai rekaman instrumen asli jika browser sedang menggunakan fallback sintetis. Status audio di studio akan memberi tahu jika sampel gagal dimuat.',
      exercise: 'Pilih satu instrumen dan jelaskan alur energi sampai bunyi terdengar.',
      check: 'Bagian utama yang bergetar pada gitar adalah apa? Jawaban: senar.',
      summary: 'Sumber getaran dan cara bunyi dibentuk berkontribusi pada karakter suara instrumen.',
      completion: 'Kamu siap lanjut jika dapat menjelaskan sumber getaran pada minimal empat contoh.'
    },
    'unit-07': {
      objectives: ['Membedakan melodi dan harmoni.', 'Menjelaskan tekstur musik secara sederhana.'],
      concept: 'Melodi menyusun pitch secara berurutan. Harmoni menghubungkan beberapa pitch yang terdengar bersamaan. Texture menjelaskan bagaimana lapisan musik disusun.',
      fundamentals: ['Melody: urutan nada yang membentuk gagasan musikal.', 'Harmony: hubungan nada-nada yang berbunyi bersama.', 'Texture: jumlah dan hubungan lapisan suara.'],
      theory: 'Sebuah lagu dapat memiliki melodi utama yang dinyanyikan, sementara instrumen pengiring memainkan harmoni. Musik juga dapat memiliki satu garis melodi saja atau beberapa garis yang saling berinteraksi.',
      visual: 'Diagram melodi memperlihatkan titik-titik yang tersusun berurutan. Diagram harmoni memperlihatkan beberapa nada pada waktu yang sama.',
      examples: 'Penyanyi menyanyikan melodi, sedangkan gitar memainkan chord pengiring. Keduanya membentuk tekstur melodi dengan iringan.',
      interaction: 'Mainkan satu nada satu per satu pada piano. Setelah itu, tekan beberapa nada bersamaan untuk mendengar perbedaan urutan dan simultan.',
      reading: 'Tentukan apakah contoh yang diberikan menggambarkan nada berurutan atau nada bersamaan.',
      listening: 'Dengarkan lagu sederhana dan fokus pada garis vokal, lalu pada instrumen pengiring.',
      speaking: 'Humming garis melodi pendek. Setelah itu, dengarkan chord pengiring dari instrumen virtual.',
      application: 'Konsep ini berlaku pada vokal solo, ansambel gitar, piano, orkestra, dan musik elektronik.',
      mistakes: 'Jangan menyamakan harmony dengan sekadar suara latar. Harmoni merujuk pada hubungan pitch yang berbunyi bersamaan.',
      exercise: 'Pilih satu lagu dan identifikasi satu contoh melodi serta satu contoh harmoni.',
      check: 'Nada yang dimainkan satu per satu membentuk apa? Jawaban: melodi jika disusun sebagai gagasan musikal.',
      summary: 'Melodi, harmoni, dan tekstur menjelaskan bagaimana nada dan lapisan musik disusun.',
      completion: 'Kamu siap lanjut jika dapat membedakan bunyi berurutan dan bersamaan melalui contoh.'
    },
    'unit-08': {
      objectives: ['Mengenali nada kedua yang lebih tinggi, lebih rendah, atau sama.', 'Membedakan pitch dari loudness saat mendengarkan.'],
      concept: 'Pitch recognition dimulai dari kemampuan membandingkan dua nada. Pada tahap awal, pengguna tidak perlu menebak nama nada secara absolut.',
      fundamentals: ['Same: kedua nada memiliki pitch sama.', 'Higher: pitch nada kedua lebih tinggi.', 'Lower: pitch nada kedua lebih rendah.', 'Loudness dan pitch adalah dimensi berbeda.'],
      theory: 'Latihan perbandingan pitch membangun kepekaan terhadap arah kontur nada. Setelah stabil, latihan dapat berkembang ke interval dan identifikasi nama nada pada level lanjutan.',
      visual: 'Tinggi batang pada ilustrasi mewakili perubahan pitch secara konseptual, bukan volume.',
      examples: 'Coba pasangan C4–D4, C4–B3, dan C4–C4. Tentukan arah perubahan atau apakah keduanya sama.',
      interaction: 'Gunakan Listening practice untuk memutar dua nada secara berurutan dan memilih jawabannya.',
      reading: 'Baca instruksi soal dan pahami bahwa kamu diminta membandingkan pitch, bukan volume.',
      listening: 'Dengarkan pasangan nada. Putar ulang dan pilih Sama, Lebih tinggi, atau Lebih rendah.',
      speaking: 'Dengarkan nada acuan lalu humming sedekat mungkin dengan nada tersebut.',
      application: 'Penyanyi, pemain instrumen melodis, dan pemain bass sama-sama perlu mendengar arah gerak pitch.',
      mistakes: 'Jangan mengandalkan nada yang lebih keras sebagai tanda pitch lebih tinggi. Fokus pada kesan tinggi-rendah.',
      exercise: 'Buat tiga pasangan nada: satu sama, satu naik, dan satu turun. Mainkan dengan instrumen pilihanmu.',
      check: 'Jika nada kedua memiliki pitch sama tetapi volumenya lebih keras, apakah pitch berubah? Jawaban: tidak.',
      summary: 'Pendengaran dasar dimulai dari membandingkan pitch dan memisahkannya dari volume.',
      completion: 'Kamu siap lanjut jika dapat menjawab minimal empat dari lima soal arah pitch dengan benar.'
    },
    'unit-09': {
      objectives: ['Menghubungkan pemahaman konsep, pendengaran, dan produksi nada.', 'Menilai kesiapan sebelum masuk ke Level 1.'],
      concept: 'Musical foundation terbentuk ketika pengguna dapat membaca informasi dasar, mendengar perbedaan, dan menghasilkan bunyi yang sesuai.',
      fundamentals: ['Reading: memahami nama nada dan konsep.', 'Listening: membandingkan pitch dan timbre.', 'Speaking: mencoba mencocokkan pitch melalui humming.', 'Instrument application: menerapkan konsep pada instrumen pilihan.'],
      theory: 'Tiga jalur latihan menguji aspek berbeda dan saling melengkapi. Skor bukan ukuran bakat; hasil digunakan untuk mengetahui materi yang perlu diulang.',
      visual: 'Peta tiga jalur belajar menunjukkan hubungan antara pemahaman, pendengaran, dan produksi bunyi.',
      examples: 'Kenali C pada keyboard, dengarkan C4 dan C5, lalu humming C4 dengan nyaman.',
      interaction: 'Selesaikan Reading, Listening, dan Speaking practice di bawah materi. Soal akan diacak setiap sesi.',
      reading: 'Uji nama nada, keyboard, octave, timbre, dan keluarga instrumen.',
      listening: 'Uji arah pitch dan perbedaan timbre dengan audio aktual.',
      speaking: 'Gunakan mikrofon untuk mengukur pitch humming terhadap nada acuan. Jika tidak ingin memakai mikrofon, kamu dapat melewati jalur ini.',
      application: 'Pilih instrumen yang kamu gunakan sehari-hari dan jelaskan bagaimana konsep pitch serta timbre muncul pada instrumen tersebut.',
      mistakes: 'Jangan terburu-buru menuju level berikutnya hanya untuk mengejar skor. Ulangi konsep yang belum terasa jelas.',
      exercise: 'Selesaikan satu sesi pada setiap jalur dan catat bagian yang paling menantang.',
      check: 'Level 0 dinyatakan siap ketika pemahaman dasar stabil dan kamu mampu menjelaskan konsep dengan contoh.',
      summary: 'Belajar musik menghubungkan apa yang dipahami, apa yang didengar, dan apa yang dapat dihasilkan.',
      completion: 'Target rekomendasi: skor minimal 70% pada masing-masing jalur. Progress disimpan lokal pada browser.'
    }
  };
    function renderLessonGuides() {
    Object.keys(lessonGuides).forEach(id => {
      const article = $(id);
      const guide = lessonGuides[id];
      if (!article || !guide) return;
      const list = items => '<ul>' + items.map(item => '<li>' + item + '</li>').join('') + '</ul>';
      const sections = [
        ['1. Lesson Introduction', 'Unit ini menghubungkan materi dengan pengalaman mendengar dan memainkan musik sehari-hari.'],
        ['2. Learning Objectives', list(guide.objectives)],
        ['3. Concept Explanation', '<p>' + guide.concept + '</p>'],
        ['4. Fundamental Elements', list(guide.fundamentals)],
        ['5. Detailed Theory', '<p>' + guide.theory + '</p>'],
        ['6. Visual Explanation', '<p>' + guide.visual + '</p>'],
        ['7. Musical Examples', '<p>' + guide.examples + '</p>'],
        ['8. Interactive Demonstration', '<p>' + guide.interaction + '</p>'],
        ['9. Reading Practice', '<p>' + guide.reading + '</p>'],
        ['10. Listening Practice', '<p>' + guide.listening + '</p>'],
        ['11. Speaking Practice', '<p>' + guide.speaking + '</p>'],
        ['12. Instrument Application', '<p>' + guide.application + '</p>'],
        ['13. Common Mistakes', '<p>' + guide.mistakes + '</p>'],
        ['14. Practice Exercises', '<p>' + guide.exercise + '</p>'],
        ['15. Knowledge Check', '<p>' + guide.check + '</p>'],
        ['16. Lesson Summary', '<p>' + guide.summary + '</p>'],
        ['17. Completion Criteria', '<p>' + guide.completion + '</p>']
      ];
      const details = document.createElement('details');
      details.className = 'l-lesson-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Open complete lesson guide · 17 learning elements';
      details.appendChild(summary);
      const body = document.createElement('div');
      body.className = 'l-lesson-guide-grid';
      sections.forEach(([heading, content]) => {
        const section = document.createElement('section');
        section.innerHTML = '<h4>' + heading + '</h4>' + content;
        body.appendChild(section);
      });
      details.appendChild(body);
      article.appendChild(details);
    });
  }

  function buildNaturalNotes() {
    const holder = $('demoKeys');
    if (!holder) return;
    holder.innerHTML = '';
    natural.forEach((name, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'l-natural-key';
      button.textContent = name;
      button.setAttribute('aria-label', 'Dengarkan nada ' + name + '4');
      button.addEventListener('click', () => {
        holder.querySelectorAll('button').forEach(key => key.classList.remove('on'));
        button.classList.add('on');
        playNote(60 + naturalPitchClasses[index]);
      });
      holder.appendChild(button);
    });
  }

  function buildLessonKeyboard() {
    const holder = $('playableKeyboard');
    if (!holder) return;
    holder.innerHTML = '';
    const whitePcs = new Set(naturalPitchClasses);
    let whiteIndex = 0;
    for (let midi = 60; midi <= 83; midi++) {
      const pc = midi % 12;
      const isWhite = whitePcs.has(pc);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'l-piano-key ' + (isWhite ? 'white' : 'black');
      button.dataset.midi = String(midi);
      button.setAttribute('aria-label', 'Mainkan ' + noteName(midi));
      button.title = noteName(midi);
      if (isWhite) {
        button.style.left = (whiteIndex * 100 / 14) + '%';
        button.style.width = (100 / 14) + '%';
        if (pc === 0 || pc === 5) button.textContent = noteName(midi);
        whiteIndex++;
      } else {
        button.style.left = ((whiteIndex * 100 / 14) - 1.55) + '%';
        button.style.width = '3.1%';
      }
      const down = event => {
        event.preventDefault();
        button.classList.add('pressed');
        playNote(midi);
        setNoteReadout(midi);
      };
      button.addEventListener('pointerdown', down);
      ['pointerup', 'pointerleave', 'pointercancel', 'lostpointercapture'].forEach(type => {
        button.addEventListener(type, () => button.classList.remove('pressed'));
      });
      button.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) down(event);
      });
      button.addEventListener('keyup', () => button.classList.remove('pressed'));
      holder.appendChild(button);
    }
  }

  function buildMiniGuitar() {
    const holder = $('guitarBoard');
    if (!holder) return;
    const strings = [
      { label: 'E', midi: 40, full: 'E rendah' },
      { label: 'A', midi: 45, full: 'A' },
      { label: 'D', midi: 50, full: 'D' },
      { label: 'G', midi: 55, full: 'G' },
      { label: 'B', midi: 59, full: 'B' },
      { label: 'E', midi: 64, full: 'E tinggi' }
    ];
    holder.innerHTML = '<div class="l-guitar-head"><span>SENAR</span><span>OPEN</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>';
    strings.forEach(string => {
      const row = document.createElement('div');
      row.className = 'l-guitar-row';
      const label = document.createElement('span');
      label.className = 'l-string-label';
      label.textContent = string.label;
      label.title = string.full;
      row.appendChild(label);
      for (let fret = 0; fret <= 5; fret++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'l-fret';
        button.textContent = fret === 0 ? '○' : '·';
        button.setAttribute('aria-label', 'Senar ' + string.full + ', fret ' + fret + ', mainkan ' + noteName(string.midi + fret));
        button.title = noteName(string.midi + fret);
        button.addEventListener('click', () => {
          row.querySelectorAll('.l-fret').forEach(key => key.classList.remove('pressed'));
          button.classList.add('pressed');
          playNote(string.midi + fret, 'steel', 2.2);
        });
        row.appendChild(button);
      }
      holder.appendChild(row);
    });
  }

  function playInstrumentDemo(button) {
    const midi = Number(button.dataset.midi || 60);
    const instrument = button.dataset.instrumentDemo;
    if (button.dataset.drum) {
      if (window.TSWInstruments && typeof window.TSWInstruments.drumSound === 'function') {
        window.TSWInstruments.drumSound(button.dataset.drum);
        setAudioStatus('Contoh perkusi: ' + button.dataset.drum + ' (sintesis).');
      }
      return;
    }
    const bankName = instrument === 'guitar' ? 'steel' : instrument;
    playNote(midi, bankName, 2.1);
    setAudioStatus('Memainkan ' + instrument + ' · ' + noteName(midi) + '. Sampel dimuat sesuai ketersediaan koneksi.');
  }

  document.querySelectorAll('[data-instrument-demo]').forEach(button => {
    button.addEventListener('click', () => playInstrumentDemo(button));
  });

  /* ═══════════════════════════════════════════════════════════════════════
     PRACTICE STUDIO v2 — soal tanpa batas, selalu baru, dibuat secara prosedural.
     Reading / Listening / Speaking. Setiap jawaban langsung tercatat di TSWProgress.
     ═══════════════════════════════════════════════════════════════════════ */
  const LEVEL = 0;
  const NAMES_SHARP = pitchClassNames;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sampleN = (arr, n) => shuffle(arr).slice(0, n);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* Buat pilihan: jawaban benar + pengecoh, diacak. Mengembalikan { options, correct (indeks) }. */
  function makeChoices(answer, pool, n) {
    n = n || 4;
    const wrong = sampleN(pool.filter(x => String(x) !== String(answer)), n - 1);
    const options = shuffle([answer].concat(wrong)).map(String);
    return { options, correct: options.indexOf(String(answer)) };
  }
  function choice(topic, prompt, answer, pool, explanation, extra) {
    const c = makeChoices(answer, pool, extra && extra.n);
    return Object.assign({ kind: 'choice', topic, prompt, options: c.options, correct: c.correct, explanation }, extra || {});
  }

  /* ── audio ── */
  let timers = [];
  const later = (fn, ms) => { timers.push(window.setTimeout(fn, ms)); };
  function clearTimers() { timers.forEach(t => window.clearTimeout(t)); timers = []; }
  function tone(inst, midi, dur, vel) {
    try {
      if (window.TSWAudio && typeof window.TSWAudio.note === 'function') {
        const h = window.TSWAudio.note(inst, midi, { dur: dur || 1.2, vel: vel == null ? 0.8 : vel });
        if (h) activeHandles.push(h);
        return true;
      }
    } catch (e) { console.warn(e); }
    audioWarn();
    return false;
  }
  function drum(type) {
    try { if (window.TSWInstruments && window.TSWInstruments.drumSound) { window.TSWInstruments.drumSound(type); return true; } } catch (e) {}
    audioWarn(); return false;
  }
  function audioWarn() { const a = $('lpAudio'); if (a) a.textContent = 'Audio instrumen belum siap. Pastikan instruments.js termuat dan koneksi internet aktif, lalu coba lagi.'; }
  function preload(names) { try { names.forEach(n => window.TSWInstruments && window.TSWInstruments.loadBank && window.TSWInstruments.loadBank(n)); } catch (e) {} }
  const INST_LABEL = { piano: 'Piano', steel: 'Gitar akustik', clean: 'Gitar listrik', violin: 'Biola' };

  /* ── gambar: keyboard satu oktaf (C–B + C) dengan satu tuts disorot ── */
  function keyboardSvg(pc) {
    const white = [0, 2, 4, 5, 7, 9, 11], blackAfter = { 0: 1, 1: 3, 3: 6, 4: 8, 5: 10 };
    let s = '<svg viewBox="0 0 330 140" class="lp-kbd" role="img" aria-label="Keyboard satu oktaf, satu tuts disorot. Tentukan namanya.">';
    white.forEach((p, i) => { s += '<rect x="' + (i * 40 + 5) + '" y="5" width="38" height="125" rx="4" fill="' + (p === pc ? '#D9A93A' : '#FFFFFF') + '" stroke="#14233F" stroke-width="1.5"/>'; });
    s += '<rect x="' + (7 * 40 + 5) + '" y="5" width="38" height="125" rx="4" fill="#FFFFFF" stroke="#14233F" stroke-width="1.5"/>';
    Object.keys(blackAfter).forEach(i => { const bp = blackAfter[i]; s += '<rect x="' + ((+i + 1) * 40 - 10 + 5) + '" y="5" width="26" height="78" rx="3" fill="' + (bp === pc ? '#C0524A' : '#14233F') + '" stroke="#0B1426" stroke-width="1.5"/>'; });
    return s + '</svg>';
  }

  /* ═════════ READING ═════════ */
  const FAMILIES = {
    Strings: ['gitar', 'biola', 'cello', 'harpa', 'kontrabas', 'ukulele', 'viola'],
    Winds: ['flute', 'klarinet', 'saksofon', 'oboe', 'trompet', 'trombon', 'tuba', 'French horn', 'recorder'],
    Percussion: ['snare drum', 'cymbal', 'xylophone', 'timpani', 'tamborin', 'kick drum', 'marimba', 'triangle'],
    Keyboard: ['piano', 'organ', 'harpsichord', 'celesta', 'synthesizer'],
    Voice: ['soprano', 'alto', 'tenor', 'bass (penyanyi)', 'paduan suara']
  };
  const PRODUCE = [
    ['gitar', 'Senar bergetar ketika dipetik atau digenjreng'],
    ['biola', 'Senar bergetar ketika digesek dengan bow'],
    ['flute', 'Udara ditiup melintasi lubang dan menggetarkan kolom udara'],
    ['klarinet', 'Reed bergetar ketika udara ditiup'],
    ['trompet', 'Bibir pemain bergetar di dalam mouthpiece'],
    ['snare drum', 'Membran (kulit drum) dipukul sehingga bergetar'],
    ['piano', 'Hammer memukul senar ketika tuts ditekan'],
    ['xylophone', 'Bilah kayu atau logam dipukul sehingga bergetar'],
    ['penyanyi', 'Pita suara bergetar ketika udara dari paru-paru melewatinya'],
    ['cello', 'Senar bergetar ketika digesek dengan bow']
  ];
  const ELEMENTS = [
    ['pitch', 'tinggi-rendahnya nada', 'pitch'], ['dynamics', 'keras-lembutnya bunyi', 'elements'], ['tempo', 'cepat-lambatnya musik', 'elements'],
    ['timbre', 'warna atau karakter suara', 'elements'], ['duration', 'lama sebuah bunyi ditahan', 'elements'], ['rhythm', 'pola ketukan dan jeda dalam waktu', 'elements'],
    ['melody', 'rangkaian nada yang terdengar berurutan', 'elements'], ['harmony', 'beberapa nada yang terdengar bersamaan', 'elements'],
    ['texture', 'cara melodi dan harmoni disusun bersama', 'elements'], ['form', 'susunan bagian musik seperti intro, verse, chorus, outro', 'elements']
  ];
  const ENHARM = { 'C♯': 'D♭', 'D♯': 'E♭', 'F♯': 'G♭', 'G♯': 'A♭', 'A♯': 'B♭' };
  const FLATS = ['D♭', 'E♭', 'G♭', 'A♭', 'B♭'];
  const SHARPS = ['C♯', 'D♯', 'F♯', 'G♯', 'A♯'];
  const GSTR = [['E rendah', 40], ['A', 45], ['D', 50], ['G', 55], ['B', 59], ['E tinggi', 64]];

  const readingGens = [
    function nextNote() { const i = rnd(0, 6), n = natural[i];
      return choice('alphabet', 'Dalam alfabet musik, nada apa yang muncul tepat setelah ' + n + '?', natural[(i + 1) % 7], natural, 'Urutan natural notes: C–D–E–F–G–A–B, lalu kembali ke C pada octave berikutnya.'); },
    function prevNote() { const i = rnd(0, 6), n = natural[i];
      return choice('alphabet', 'Nada apa yang muncul tepat sebelum ' + n + ' dalam alfabet musik?', natural[(i + 6) % 7], natural, 'Urutannya C–D–E–F–G–A–B. Sebelum C adalah B dari octave di bawahnya.'); },
    function stepsNote() { const i = rnd(0, 6), k = rnd(2, 4);
      return choice('alphabet', 'Mulai dari ' + natural[i] + ', naik ' + k + ' nama huruf (hitung ' + natural[i] + ' sebagai 0). Sampai di nada…', natural[(i + k) % 7], natural, 'Hitung maju ' + k + ' langkah pada urutan C–D–E–F–G–A–B, dan kembali ke C setelah B.'); },
    function keyboardWhite() { const pc = pickOne([0, 2, 4, 5, 7, 9, 11]);
      return choice('keyboard', 'Tuts putih yang disorot pada keyboard di bawah adalah nada…', NAMES_SHARP[pc], natural, 'Cari kelompok dua tuts hitam: tuts putih di kirinya adalah C. Dari sana lanjutkan C–D–E; kelompok tiga tuts hitam membantumu menemukan F–G–A–B.',
        { visual: keyboardSvg(pc), after: () => tone('piano', 60 + pc, 1.4) }); },
    function keyboardBlack() { const pc = pickOne([1, 3, 6, 8, 10]);
      return choice('keyboard', 'Tuts hitam yang disorot adalah… (gunakan nama dengan sharp)', NAMES_SHARP[pc], SHARPS, 'Tuts hitam di kanan sebuah tuts putih adalah sharp (♯) dari nada putih itu. ' + NAMES_SHARP[pc] + ' juga bisa disebut ' + ENHARM[NAMES_SHARP[pc]] + '.',
        { visual: keyboardSvg(pc), after: () => tone('piano', 60 + pc, 1.4) }); },
    function enharmonic() { const s = pickOne(SHARPS);
      return choice('keyboard', s + ' memiliki nama lain (enharmonic) yaitu…', ENHARM[s], FLATS, 'Satu tuts hitam bisa punya dua nama: ' + s + ' = ' + ENHARM[s] + '. Nadanya sama, hanya penulisannya berbeda.'); },
    function semitoneUp() { const i = rnd(0, 6), pc = naturalPitchClasses[i], t = (pc + 1) % 12;
      return choice('pitch', 'Satu semitone (setengah langkah) di atas ' + natural[i] + ' adalah…', NAMES_SHARP[t], NAMES_SHARP, natural[i] === 'E' || natural[i] === 'B' ? 'Antara E–F dan B–C tidak ada tuts hitam, jadi jaraknya sudah satu semitone.' : 'Sharp menaikkan nada satu semitone, dan tuts hitam berada tepat di antara dua tuts putih tersebut.'); },
    function semitoneDown() { const i = rnd(0, 6), pc = naturalPitchClasses[i], t = (pc + 11) % 12;
      return choice('pitch', 'Satu semitone di bawah ' + natural[i] + ' adalah…', NAMES_SHARP[t], NAMES_SHARP, 'Turun satu semitone berarti bergerak ke tuts terdekat di sebelah kiri, baik putih maupun hitam.'); },
    function octaveFacts() {
      const T = [
        ['Berapa jumlah semitone dalam satu octave?', '12', ['7', '8', '10', '12', '14'], 'Satu octave berisi 12 semitone: 7 tuts putih + 5 tuts hitam pada piano.'],
        ['Berapa nama huruf natural dalam alfabet musik?', '7', ['5', '6', '7', '8', '12'], 'Nama natural: C, D, E, F, G, A, B.'],
        ['C4 dan C5 memiliki hubungan…', 'Octave', ['Octave', 'Timbre', 'Semitone', 'Chord'], 'Dua nada bernama sama pada register berbeda berjarak satu octave.'],
        ['Pada piano, pola tuts hitam yang berulang adalah…', 'Kelompok 2 dan 3', ['Kelompok 2 dan 3', 'Kelompok 1 dan 4', 'Semua berpasangan', 'Selalu berkelompok 5'], 'Dua dan tiga tuts hitam berulang di setiap octave dan membantu menemukan posisi nada.']
      ]; const t = pickOne(T);
      return choice('keyboard', t[0], t[1], t[2], t[3]); },
    function frequency() { const k = rnd(0, 3);
      if (k === 0) return choice('pitch', 'Nada dengan frekuensi lebih tinggi akan terdengar…', 'Lebih tinggi (pitch naik)', ['Lebih tinggi (pitch naik)', 'Lebih rendah', 'Lebih keras saja', 'Berubah timbre saja'], 'Frekuensi adalah jumlah getaran per detik. Semakin cepat getarannya, semakin tinggi pitch.');
      if (k === 1) return choice('pitch', 'Nada standar A4 untuk menyetel instrumen memiliki frekuensi…', '440 Hz', ['220 Hz', '261 Hz', '440 Hz', '880 Hz', '523 Hz'], 'A4 = 440 Hz adalah acuan penyetelan standar.');
      const f = pickOne([110, 196, 220, 262, 330, 440]), up = Math.random() < 0.6;
      return choice('pitch', 'Nada satu octave ' + (up ? 'di atas' : 'di bawah') + ' ' + (up ? f : f * 2) + ' Hz memiliki frekuensi…', (up ? f * 2 : f) + ' Hz', [(up ? f * 2 : f) + ' Hz', (up ? f * 3 : f * 3) + ' Hz', (up ? f * 1.5 : f / 2) + ' Hz', (up ? f + 100 : f * 4) + ' Hz', (up ? f / 2 : f + 50) + ' Hz'], 'Naik satu octave berarti frekuensi dikali 2, turun satu octave berarti dibagi 2.'); },
    function families() { const fam = pickOne(Object.keys(FAMILIES)), ins = pickOne(FAMILIES[fam]);
      return choice('families', ins.charAt(0).toUpperCase() + ins.slice(1) + ' termasuk keluarga instrumen…', fam, Object.keys(FAMILIES), 'Strings: senar. Winds: tiupan. Percussion: dipukul atau digoyang. Keyboard: bertuts. Voice: suara manusia.'); },
    function familyReverse() { const fam = pickOne(Object.keys(FAMILIES)), others = Object.keys(FAMILIES).filter(f => f !== fam), ans = pickOne(FAMILIES[fam]);
      const wrong = others.map(o => pickOne(FAMILIES[o]));
      return choice('families', 'Manakah yang termasuk keluarga ' + fam + '?', ans, wrong.concat([ans]), ans + ' termasuk ' + fam + '; pengecoh berasal dari keluarga lain.'); },
    function production() { const p = pickOne(PRODUCE);
      return choice('production', 'Bagaimana ' + p[0] + ' menghasilkan bunyi?', p[1], PRODUCE.map(x => x[1]), 'Hampir semua bunyi musik berasal dari getaran. Yang berbeda adalah apa yang digetarkan: ' + p[1].toLowerCase() + '.'); },
    function elementDef() { const e = pickOne(ELEMENTS);
      if (Math.random() < 0.5) return choice(e[2], 'Unsur musik yang berkaitan dengan ' + e[1] + ' disebut…', e[0], ELEMENTS.map(x => x[0]), e[0].charAt(0).toUpperCase() + e[0].slice(1) + ' = ' + e[1] + '.');
      return choice(e[2], 'Apa arti "' + e[0] + '" dalam musik?', e[1], ELEMENTS.map(x => x[1]), e[0].charAt(0).toUpperCase() + e[0].slice(1) + ' = ' + e[1] + '.'); },
    function textureQ() {
      const T = [
        ['Beberapa nada dibunyikan bersamaan disebut…', 'Harmony', ['Harmony', 'Melody', 'Rhythm', 'Tempo'], 'Harmony adalah nada-nada yang terdengar bersamaan; melody berurutan.'],
        ['Satu garis melodi tanpa iringan memiliki tekstur…', 'Monophonic', ['Monophonic', 'Homophonic', 'Polyphonic', 'Silent'], 'Monophonic: hanya satu garis melodi.'],
        ['Melodi utama dengan iringan akor memiliki tekstur…', 'Homophonic', ['Monophonic', 'Homophonic', 'Polyphonic', 'Staccato'], 'Homophonic: satu melodi dominan dengan iringan.'],
        ['Beberapa melodi independen yang dimainkan bersamaan memiliki tekstur…', 'Polyphonic', ['Monophonic', 'Homophonic', 'Polyphonic', 'Dynamic'], 'Polyphonic: beberapa garis melodi berjalan sendiri-sendiri sekaligus.']
      ]; const t = pickOne(T); return choice('elements', t[0], t[1], t[2], t[3]); },
    function guitarFret() { const s = pickOne(GSTR.slice(0, 5)), f = rnd(1, 7), m = s[1] + f;
      return choice('guitar', 'Pada gitar standar, senar ' + s[0] + ' ditekan di fret ' + f + '. Nada yang berbunyi adalah…', NAMES_SHARP[m % 12], NAMES_SHARP, 'Setiap naik satu fret, pitch naik satu semitone. Mulai dari nada senar kosong lalu hitung ' + f + ' semitone.', { after: () => tone('steel', m, 1.8) }); },
    function guitarFacts() {
      const T = [
        ['Urutan senar gitar standar dari yang paling tebal ke paling tipis adalah…', 'E – A – D – G – B – E', ['E – A – D – G – B – E', 'C – D – E – F – G – A', 'A – B – C – D – E – F', 'G – D – A – E – B – F'], 'Tuning standar: E A D G B E.'],
        ['Naik satu fret pada gitar berarti pitch naik…', 'Satu semitone', ['Satu semitone', 'Satu octave', 'Dua octave', 'Tidak berubah'], 'Jarak antar-fret adalah satu semitone.'],
        ['Senar gitar yang kosong (open string) berarti…', 'Dipetik tanpa menekan fret', ['Dipetik tanpa menekan fret', 'Senar putus', 'Ditekan di fret 12', 'Digesek dengan bow'], 'Open string dibunyikan tanpa jari menekan fret.']
      ]; const t = pickOne(T); return choice('guitar', t[0], t[1], t[2], t[3]); }
  ];

  /* ═════════ LISTENING ═════════ */
  const listeningGens = [
    function contour() {
      const a = rnd(55, 77), d = pickOne([-7, -5, -3, -2, 0, 2, 3, 5, 7]), b = a + d, ans = d === 0 ? 'Sama' : d > 0 ? 'Lebih tinggi' : 'Lebih rendah';
      return { kind: 'choice', topic: 'contour', prompt: 'Dengarkan dua nada. Dibanding nada pertama, nada kedua terdengar…', ...makeChoices(ans, ['Sama', 'Lebih tinggi', 'Lebih rendah'], 3),
        explanation: d === 0 ? 'Kedua nada memiliki pitch yang sama.' : d > 0 ? 'Nada kedua memiliki frekuensi lebih tinggi, jadi pitch naik.' : 'Nada kedua memiliki frekuensi lebih rendah, jadi pitch turun.',
        play: () => { tone('piano', a, 1.1); later(() => tone('piano', b, 1.1), 1000); } }; },
    function interval() {
      const near = Math.random() < 0.5, d = near ? pickOne([1, 2]) : pickOne([7, 8, 9, 12]), a = rnd(55, 70), b = Math.random() < 0.5 ? a + d : a - d, ans = near ? 'Dekat' : 'Jauh';
      return { kind: 'choice', topic: 'interval', prompt: 'Dengarkan dua nada. Seberapa jauh jarak keduanya?', ...makeChoices(ans, ['Dekat', 'Jauh'], 2),
        explanation: near ? 'Jaraknya hanya ' + d + ' semitone, jadi terdengar dekat.' : 'Jaraknya ' + d + ' semitone, jadi terdengar jauh.',
        play: () => { tone('piano', a, 1.1); later(() => tone('piano', b, 1.1), 1000); } }; },
    function melodyShape() {
      const base = rnd(58, 68), P = { 'Naik': [0, 3, 7], 'Turun': [7, 3, 0], 'Naik lalu turun': [0, 5, 0], 'Turun lalu naik': [5, 0, 5] }, k = pickOne(Object.keys(P)), seq = P[k].map(x => base + x);
      return { kind: 'choice', topic: 'melodyshape', prompt: 'Dengarkan tiga nada berurutan. Arah melodinya…', ...makeChoices(k, Object.keys(P), 4),
        explanation: 'Perhatikan apakah tiap nada lebih tinggi atau lebih rendah dari nada sebelumnya.',
        play: () => seq.forEach((m, i) => later(() => tone('piano', m, 0.9), i * 750)) }; },
    function noteName() {
      const pc = pickOne([0, 2, 4, 5, 7, 9, 11]), m = 60 + pc, ans = NAMES_SHARP[pc];
      return { kind: 'choice', topic: 'notename', prompt: 'Dengarkan nada ini. Tekan "Nada acuan C" bila perlu sebagai pembanding. Nada apa ini?', ...makeChoices(ans, natural, 4),
        explanation: 'Nada yang kamu dengar adalah ' + ans + '4. Bandingkan dengan C4: semakin jauh dari C, semakin tinggi terdengar.',
        play: () => tone('piano', m, 1.6), ref: () => tone('piano', 60, 1.4), refLabel: 'Nada acuan C' }; },
    function octave() {
      const pc = pickOne([0, 2, 4, 5, 7, 9, 11]), a = 60 + pc, k = pickOne(['up', 'down', 'diff']);
      const b = k === 'up' ? a + 12 : k === 'down' ? a - 12 : a + pickOne([2, 3, 4, 5, 7]);
      const A = 'Nama sama, satu octave lebih tinggi', B = 'Nama sama, satu octave lebih rendah', C = 'Nama nada berbeda', ans = k === 'up' ? A : k === 'down' ? B : C;
      return { kind: 'choice', topic: 'octave', prompt: 'Dengarkan dua nada. Bagaimana hubungan nada kedua dengan nada pertama?', ...makeChoices(ans, [A, B, C], 3),
        explanation: k === 'diff' ? 'Kedua nada berbeda nama, bukan octave.' : 'Dua nada bernama sama terdengar "mirip" tetapi berbeda register; frekuensinya berkelipatan dua.',
        play: () => { tone('piano', a, 1.2); later(() => tone('piano', b, 1.2), 1100); } }; },
    function timbre() {
      const ins = pickOne(['piano', 'steel', 'violin', 'clean']), m = pickOne([55, 60, 64, 67]), all = ['piano', 'steel', 'violin', 'clean'].map(i => INST_LABEL[i]);
      return { kind: 'choice', topic: 'timbre', prompt: 'Dengarkan instrumen ini. Instrumen apa yang berbunyi?', ...makeChoices(INST_LABEL[ins], all, 4),
        explanation: 'Pitch bisa sama, tetapi timbre (warna suara) membedakan piano, gitar, dan biola. Bila sampel belum termuat, suara memakai simulasi sintetis.',
        play: () => tone(ins, m, 2.0), preload: ['piano', 'steel', 'violin', 'clean'] }; },
    function texture() {
      const base = rnd(55, 68), iv = pickOne([4, 7]), harm = Math.random() < 0.5, ans = harm ? 'Harmony (bersamaan)' : 'Melody (berurutan)';
      return { kind: 'choice', topic: 'texture', prompt: 'Dengarkan dua nada. Apakah ini melody atau harmony?', ...makeChoices(ans, ['Harmony (bersamaan)', 'Melody (berurutan)'], 2),
        explanation: harm ? 'Dua nada terdengar bersamaan = harmony.' : 'Dua nada terdengar satu demi satu = melody.',
        play: () => { if (harm) { tone('piano', base, 1.8); tone('piano', base + iv, 1.8); } else { tone('piano', base, 1.0); later(() => tone('piano', base + iv, 1.0), 900); } } }; },
    function dynamics() {
      const m = rnd(57, 69), loud2 = Math.random() < 0.5, ans = loud2 ? 'Lebih keras' : 'Lebih lembut', v1 = loud2 ? 0.2 : 0.95, v2 = loud2 ? 0.95 : 0.2;
      return { kind: 'choice', topic: 'dynamics', prompt: 'Dengarkan dua nada yang sama. Nada kedua terdengar…', ...makeChoices(ans, ['Lebih keras', 'Lebih lembut', 'Sama keras'], 3),
        explanation: 'Dynamics adalah keras-lembutnya bunyi. Pitch tetap sama, hanya volumenya berubah.',
        play: () => { tone('piano', m, 1.2, v1); later(() => tone('piano', m, 1.2, v2), 1100); } }; },
    function tempo() {
      const slow = [0, 900, 1800, 2700], fast = [0, 380, 760, 1140], second = Math.random() < 0.5 ? 'fast' : 'slow', ans = second === 'fast' ? 'Lebih cepat' : 'Lebih lambat';
      const A = second === 'fast' ? slow : fast, B = second === 'fast' ? fast : slow;
      return { kind: 'choice', topic: 'tempo', prompt: 'Dengarkan dua rangkaian ketukan. Rangkaian kedua terdengar…', ...makeChoices(ans, ['Lebih cepat', 'Lebih lambat', 'Sama cepat'], 3),
        explanation: 'Tempo adalah cepat-lambatnya ketukan, diukur dalam BPM. Jarak antar-ketukan yang lebih pendek berarti tempo lebih cepat.',
        play: () => { A.forEach(t => later(() => drum('hihat'), t)); B.forEach(t => later(() => drum('hihat'), 3900 + t)); } }; },
    function percussion() {
      const T = { kick: 'Kick drum', snare: 'Snare drum', hihat: 'Hi-hat', crash: 'Cymbal crash' }, k = pickOne(Object.keys(T));
      return { kind: 'choice', topic: 'percussion', prompt: 'Dengarkan perkusi ini. Bunyi apa yang kamu dengar?', ...makeChoices(T[k], Object.keys(T).map(x => T[x]), 4),
        explanation: 'Kick: rendah dan berdebum. Snare: renyah. Hi-hat: tipis dan singkat. Crash: panjang dan berdesis. (Suara drum adalah simulasi sintetis.)',
        play: () => drum(k) }; }
  ];

  /* ═════════ SPEAKING (mikrofon) ═════════ */
  const speakingGens = [
    function matchPitch() {
      const midi = pickOne([60, 62, 64, 65, 67, 69, 71]);
      return { kind: 'sing', topic: 'match', midi, prompt: 'Dengarkan nada acuan, lalu humming nada yang sama.', target: noteName(midi),
        explanation: 'Pitch matching berarti menghasilkan nada sedekat mungkin dengan nada acuan. Octave mana pun diterima agar sesuai rentang suaramu.',
        play: () => tone('piano', midi, 2.2) }; },
    function singInterval() {
      const midi = pickOne([60, 62, 64, 65, 67]), up = pickOne([2, 4, 5, 7]), target = midi + up;
      return { kind: 'sing', topic: 'interval', midi: target, prompt: 'Dengarkan nada acuan ' + noteName(midi) + '. Lalu nyanyikan nada ' + up + ' semitone di atasnya (' + NAMES_SHARP[target % 12] + ').', target: NAMES_SHARP[target % 12],
        explanation: 'Dari ' + NAMES_SHARP[midi % 12] + ' naik ' + up + ' semitone sampai ' + NAMES_SHARP[target % 12] + '. Octave mana pun diterima.',
        play: () => tone('piano', midi, 2.2), playTarget: () => tone('piano', target, 2.2) }; }
  ];

  const GENS = { reading: readingGens, listening: listeningGens, speaking: speakingGens };
  let q = null, answered = false, lastGen = -1, history = [], sess = { n: 0, ok: 0, streak: 0 }, busy = false;

  function newQuestion() {
    const gens = GENS[currentMode];
    let cand = null;
    for (let tries = 0; tries < 40; tries++) {
      const gi = rnd(0, gens.length - 1);
      if (gi === lastGen && gens.length > 1 && tries < 25) continue;
      cand = gens[gi]();
      const sig = currentMode + '|' + cand.prompt + '|' + (cand.options ? cand.options[cand.correct] : '') + '|' + (cand.midi || '') + '|' + (cand.visual ? cand.visual.length : '');
      lastGen = gi;
      if (history.indexOf(sig) === -1 || tries >= 39) { history.push(sig); if (history.length > 14) history.shift(); return cand; }
    }
    return cand || gens[0]();
  }

  function moduleStatsNow() { return window.TSWProgress ? window.TSWProgress.moduleStats(LEVEL, currentMode) : null; }

  function scoreBar() {
    const s = moduleStatsNow(); if (!s) return '';
    const p = s.recentN ? s.recentPct : 0;
    return '<div class="lp-score"><span>Skor terkini <b>' + p + '%</b> · ' + s.recentN + ' jawaban terakhir · target ≥70% dari minimal 10 jawaban</span>' +
      '<div class="lp-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><i style="width:' + p + '%"></i><u></u></div></div>';
  }

  const TOPIC_LABEL = () => { const c = window.TSWProgress && window.TSWProgress.config[LEVEL]; return c ? c.modules[currentMode].topics : {}; };

  function renderQuestion() {
    stopLessonAudio(); clearTimers(); busy = false;
    q = newQuestion(); answered = false; q.locked = false;
    if (q.preload) preload(q.preload); else if (currentMode === 'reading') preload(['piano', 'steel']); else preload(['piano']);
    const tl = TOPIC_LABEL()[q.topic] || q.topic;
    let h = '<div class="lp-card"><div class="lp-top"><span class="lp-chip">' + currentMode.toUpperCase() + ' · ' + esc(tl) + '</span>' +
      '<span class="lp-count">Soal ke-' + (sess.n + 1) + ' · benar ' + sess.ok + (sess.streak > 1 ? ' · 🔥 ' + sess.streak + ' beruntun' : '') + '</span></div><div class="lp-body">' + scoreBar() +
      '<p class="lp-prompt">' + esc(q.prompt) + '</p>';
    if (q.visual) h += '<div class="lp-visual">' + q.visual + '</div>';
    if (q.kind === 'choice' && currentMode === 'listening') {
      h += '<div class="lp-audiorow"><button type="button" class="lp-play" id="lpPlay">▶ Dengarkan' + (q.topic === 'timbre' ? ' instrumen' : ' soal') + '</button>' +
        (q.ref ? '<button type="button" class="lp-play lp-alt" id="lpRef">♪ ' + esc(q.refLabel) + '</button>' : '') + '</div>' +
        '<p class="lp-hint" id="lpAudio">Tekan tombol untuk mendengar. Boleh diulang sebanyak yang kamu mau.</p>';
    }
    if (q.kind === 'sing') {
      h += '<div class="lp-target"><span>' + esc(q.target) + '</span><small>NADA TARGET</small></div><div class="lp-audiorow"><button type="button" class="lp-play" id="lpPlay">▶ Dengarkan nada acuan</button>' +
        (q.playTarget ? '<button type="button" class="lp-play lp-alt" id="lpTarget">♪ Dengarkan nada target</button>' : '') +
        '<button type="button" class="lp-play lp-rec" id="lpMic">● Mulai humming (3 dtk)</button></div>' +
        '<p class="lp-hint" id="lpAudio">Mikrofon hanya aktif setelah kamu menekan tombol dan memberi izin. Suara dianalisis sementara di perangkatmu dan tidak direkam atau diunggah.</p>';
    }
    if (q.kind === 'choice') h += '<div class="lp-options" id="answers" style="--n:' + q.options.length + '">' + q.options.map((o, i) => '<button type="button" data-i="' + i + '"><kbd>' + (i + 1) + '</kbd>' + esc(o) + '</button>').join('') + '</div>';
    h += '<p class="lp-fb" id="feedback" role="status" aria-live="polite"></p><div class="lp-actions"><button type="button" class="lp-skip" id="lpSkip">Lewati soal (tidak dihitung)</button><button type="button" class="lp-next" id="lpNext" hidden>Soal berikutnya →</button></div></div></div>';
    $('lab').innerHTML = h;
    $('lab').classList.remove('lp-in'); void $('lab').offsetWidth; $('lab').classList.add('lp-in');
    if ($('lpPlay')) $('lpPlay').addEventListener('click', () => { stopLessonAudio(); clearTimers(); q.play(); });
    if ($('lpRef')) $('lpRef').addEventListener('click', () => { stopLessonAudio(); clearTimers(); q.ref(); });
    if ($('lpTarget')) $('lpTarget').addEventListener('click', () => { stopLessonAudio(); q.playTarget(); });
    if ($('lpMic')) $('lpMic').addEventListener('click', () => runPitchMatch(q));
    if ($('answers')) $('answers').addEventListener('click', e => { const b = e.target.closest('button[data-i]'); if (b && !b.disabled) onChoice(+b.dataset.i, b); });
    $('lpSkip').addEventListener('click', () => { renderQuestion(); });
    $('lpNext').addEventListener('click', renderQuestion);
  }

  function onChoice(i, btn) { finishAnswer(i === q.correct, q.explanation, btn); }

  function finishAnswer(correct, explanation, btn, prefix) {
    if (answered) return; answered = true; q.locked = true;
    sess.n++; if (correct) { sess.ok++; sess.streak++; } else sess.streak = 0;
    if (window.TSWProgress) window.TSWProgress.record(LEVEL, currentMode, q.topic, correct);
    document.querySelectorAll('#answers button').forEach((b, i) => { b.disabled = true; if (i === q.correct) b.classList.add('ok'); });
    if (btn) btn.classList.add(correct ? 'ok' : 'bad');
    const fb = $('feedback'); fb.className = 'lp-fb ' + (correct ? 'ok' : 'err');
    fb.textContent = (correct ? 'Tepat. ' : 'Belum tepat. ') + (prefix ? prefix + ' ' : '') + explanation;
    $('lpSkip').hidden = true; const nx = $('lpNext'); nx.hidden = false; nx.focus();
    const top = document.querySelector('.lp-count'); if (top) top.textContent = 'Soal ke-' + sess.n + ' · benar ' + sess.ok + (sess.streak > 1 ? ' · 🔥 ' + sess.streak + ' beruntun' : '');
    const sc = document.querySelector('.lp-score'); if (sc) sc.outerHTML = scoreBar();
    if (q.after) later(() => q.after(), 350);
    updateProgress();
    if (sess.n % 10 === 0) fb.textContent += ' · Checkpoint ' + sess.n + ' soal: ' + sess.ok + ' benar. Lihat rincian kemampuanmu di bawah.';
  }

  document.addEventListener('keydown', e => {
    if (!q || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
    if (!$('lab') || !$('lab').contains(document.activeElement) && document.activeElement !== document.body) return;
    if (!answered && q.kind === 'choice' && /^[1-9]$/.test(e.key)) { const b = document.querySelector('#answers button[data-i="' + (+e.key - 1) + '"]'); if (b) { e.preventDefault(); b.click(); } }
    else if (answered && (e.key === 'ArrowRight' || e.key === 'n')) { e.preventDefault(); renderQuestion(); }
  });

  /* ── pitch dari mikrofon (YIN) ── */
  function median(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
  }

  /* YIN difference-function pitch estimator; returns Hz or null. */
  function detectPitchYIN(buffer, sampleRate) {
    const size = buffer.length;
    let rms = 0;
    for (let i = 0; i < size; i++) rms += buffer[i] * buffer[i];
    if (Math.sqrt(rms / size) < 0.012) return null;

    const minLag = Math.max(2, Math.floor(sampleRate / 850));
    const maxLag = Math.min(Math.floor(sampleRate / 75), Math.floor(size / 2));
    const difference = new Float32Array(maxLag + 1);
    for (let lag = 1; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < size - lag; i++) {
        const delta = buffer[i] - buffer[i + lag];
        sum += delta * delta;
      }
      difference[lag] = sum;
    }
    let running = 0;
    const cmnd = new Float32Array(maxLag + 1);
    cmnd[0] = 1;
    for (let lag = 1; lag <= maxLag; lag++) {
      running += difference[lag];
      cmnd[lag] = running ? difference[lag] * lag / running : 1;
    }
    let chosen = -1;
    for (let lag = minLag; lag <= maxLag; lag++) {
      if (cmnd[lag] < 0.15) {
        while (lag + 1 <= maxLag && cmnd[lag + 1] < cmnd[lag]) lag++;
        chosen = lag;
        break;
      }
    }
    if (chosen < 0) {
      let best = 1;
      for (let lag = minLag; lag <= maxLag; lag++) if (cmnd[lag] < best) { best = cmnd[lag]; chosen = lag; }
      if (best > 0.28) return null;
    }
    const left = cmnd[chosen - 1] || cmnd[chosen];
    const center = cmnd[chosen];
    const right = cmnd[chosen + 1] || cmnd[chosen];
    const denominator = left - 2 * center + right;
    const shift = denominator ? 0.5 * (left - right) / denominator : 0;
    const refinedLag = chosen + Math.max(-0.5, Math.min(0.5, shift));
    return refinedLag > 0 ? sampleRate / refinedLag : null;
  }


  async function runPitchMatch(question) {
    if (busy || answered) return;
    const button = $('lpMic'); busy = true; button.disabled = true; button.textContent = '● Meminta izin mikrofon…';
    const reset = msg => { busy = false; if ($('lpMic')) { $('lpMic').disabled = false; $('lpMic').textContent = '● Coba lagi'; } showMicError(msg); };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return reset('Browser ini tidak menyediakan akses mikrofon. Gunakan browser modern lewat HTTPS atau localhost. Kamu bisa menekan "Lewati soal".');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      activeMicStream = stream;
      const AC = window.AudioContext || window.webkitAudioContext;
      audioContext = audioContext || new AC();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const analyser = audioContext.createAnalyser(); analyser.fftSize = 4096; analyser.smoothingTimeConstant = 0;
      const source = audioContext.createMediaStreamSource(stream), buffer = new Float32Array(analyser.fftSize), readings = [];
      button.textContent = '● Dengarkan humming…'; $('feedback').className = 'lp-fb'; $('feedback').textContent = 'Humming nada dengan stabil selama 3 detik.';
      const started = performance.now();
      await new Promise(resolve => { const sample = () => { if (performance.now() - started >= 3200) return resolve(); analyser.getFloatTimeDomainData(buffer); const hz = detectPitchYIN(buffer, audioContext.sampleRate); if (hz && hz > 0) readings.push(69 + 12 * Math.log2(hz / 440)); window.setTimeout(sample, 80); }; sample(); });
      stream.getTracks().forEach(t => t.stop()); activeMicStream = null; source.disconnect(); analyser.disconnect();
      const stable = median(readings);
      if (stable == null || readings.length < 5) return reset('Nada belum terdeteksi stabil. Coba lagi di tempat tenang dan humming secara berkelanjutan. Percobaan ini tidak dihitung.');
      /* octave-folded: selisih ke target diukur modulo 12 agar cocok dengan rentang suara siapa pun */
      let diff = ((stable - question.midi) % 12 + 12) % 12; if (diff > 6) diff -= 12;
      const nearest = Math.round(stable), cents = Math.round((stable - nearest) * 100), ok = Math.abs(diff) <= 0.6;
      const detected = 'Terdeteksi ' + noteName(nearest) + ' (' + (cents > 0 ? '+' : '') + cents + ' cents).';
      const detail = ok ? 'Pitch kamu dekat dengan target ' + question.target + '. ' + question.explanation
        : (diff > 0 ? 'Pitch terdengar sedikit lebih tinggi dari ' + question.target + '. Turunkan sedikit.' : 'Pitch terdengar sedikit lebih rendah dari ' + question.target + '. Naikkan sedikit.');
      busy = false; if ($('lpMic')) { $('lpMic').textContent = 'Humming selesai'; $('lpMic').disabled = true; }
      finishAnswer(ok, detail, null, detected);
    } catch (error) {
      if (stream) stream.getTracks().forEach(t => t.stop()); activeMicStream = null;
      reset(error && error.name === 'NotAllowedError' ? 'Izin mikrofon ditolak. Kamu tetap bisa belajar tanpa mikrofon; tekan "Lewati soal".' : 'Mikrofon tidak dapat digunakan. Periksa izin browser lalu coba lagi.');
    }
  }
  function showMicError(msg) { const fb = $('feedback'); if (fb) { fb.className = 'lp-fb err'; fb.textContent = msg; } }

  function updateProgress() {
    const holder = $('level0Progress'); if (!holder) return;
    if (window.TSWProgress) window.TSWProgress.renderTracker(holder, LEVEL);
    else holder.innerHTML = '<p class="l-hint">Modul tsw-progress.js belum dimuat, sehingga hasil latihan belum bisa disimpan.</p>';
  }

  document.querySelectorAll('.l-tabs [role="tab"]').forEach(tab => {
    tab.addEventListener('click', () => {
      currentMode = tab.dataset.mode; sess = { n: 0, ok: 0, streak: 0 }; history = []; lastGen = -1;
      document.querySelectorAll('.l-tabs [role="tab"]').forEach(item => { const on = item === tab; item.setAttribute('aria-selected', String(on)); item.classList.toggle('active', on); });
      renderQuestion();
    });
  });

  renderLessonGuides();
  buildNaturalNotes();
  buildLessonKeyboard();
  buildMiniGuitar();

  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopLessonAudio(); clearTimers(); } });
  window.TSWPractice = { current: () => q, mode: () => currentMode };

  updateProgress();
  renderQuestion();
})();
