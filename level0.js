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

  function shuffleOptions(correct, pool) {
    const values = [...new Set([correct, ...pool])];
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  const readingBank = [
    { prompt: 'Dalam alfabet musik, nada apa yang muncul setelah E?', answer: 'F', options: ['D', 'F', 'G', 'A'], explanation: 'Urutan natural notes adalah C–D–E–F–G–A–B, lalu kembali ke C.' },
    { prompt: 'Nada apa yang muncul setelah B dalam urutan alfabet musik?', answer: 'C', options: ['A', 'C', 'D', 'E'], explanation: 'Setelah B, urutan nama nada kembali ke C pada octave berikutnya.' },
    { prompt: 'Pada keyboard, tuts putih di sebelah kiri kelompok dua tuts hitam adalah…', answer: 'C', options: ['A', 'C', 'E', 'G'], explanation: 'Kelompok dua tuts hitam menjadi penanda visual. Tuts putih tepat di sebelah kirinya adalah C.' },
    { prompt: 'Istilah untuk karakter atau warna khas suatu suara adalah…', answer: 'Timbre', options: ['Tempo', 'Timbre', 'Pitch', 'Duration'], explanation: 'Timbre membedakan karakter suara piano, gitar, biola, dan suara manusia.' },
    { prompt: 'Dua nada bernama C tetapi berada pada register berbeda memiliki hubungan…', answer: 'Octave', options: ['Timbre', 'Octave', 'Dynamics', 'Texture'], explanation: 'C4 dan C5 memiliki nama huruf sama dan berjarak satu octave.' },
    { prompt: 'Susunan beberapa nada yang terdengar satu demi satu disebut…', answer: 'Melody', options: ['Harmony', 'Melody', 'Timbre', 'Dynamics'], explanation: 'Melodi adalah rangkaian nada yang terdengar secara berurutan.' },
    { prompt: 'Instrumen yang menghasilkan bunyi dari senar yang dipetik atau digesek termasuk keluarga…', answer: 'Strings', options: ['Winds', 'Strings', 'Percussion', 'Voice'], explanation: 'Gitar, biola, cello, dan bass merupakan contoh instrumen bersenar.' }
  ];

  function makeReadingQuestion() {
    const source = readingBank[Math.floor(Math.random() * readingBank.length)];
    return { ...source, type: 'choice', options: shuffleOptions(source.answer, source.options) };
  }

  function makeListeningQuestion() {
    const type = Math.random() < 0.72 ? 'contour' : 'timbre';
    if (type === 'contour') {
      const first = 60 + Math.floor(Math.random() * 8);
      const movement = [-3, -2, 0, 2, 3][Math.floor(Math.random() * 5)];
      const second = first + movement;
      const answer = movement === 0 ? 'Sama' : movement > 0 ? 'Lebih tinggi' : 'Lebih rendah';
      return {
        type, first, second, answer,
        options: shuffleOptions(answer, ['Sama', 'Lebih tinggi', 'Lebih rendah']),
        prompt: 'Dengarkan dua nada. Bagaimana pitch nada kedua dibandingkan dengan nada pertama?',
        explanation: movement === 0 ? 'Kedua nada memiliki pitch yang sama.' : movement > 0 ? 'Nada kedua memiliki pitch lebih tinggi.' : 'Nada kedua memiliki pitch lebih rendah.'
      };
    }
    const firstInstrument = ['piano', 'guitar', 'violin'][Math.floor(Math.random() * 3)];
    let secondInstrument = ['piano', 'guitar', 'violin'][Math.floor(Math.random() * 3)];
    while (secondInstrument === firstInstrument) secondInstrument = ['piano', 'guitar', 'violin'][Math.floor(Math.random() * 3)];
    return {
      type, first: 64, second: 64, firstInstrument, secondInstrument,
      answer: 'Timbre', options: ['Pitch', 'Timbre', 'Tempo'],
      prompt: 'Dua instrumen memainkan nada yang sama. Unsur apa yang paling jelas berubah?',
      explanation: 'Pitch targetnya sama. Yang berubah adalah timbre atau karakter warna suara instrumen.'
    };
  }

  function playListeningQuestion(question) {
    stopLessonAudio();
    if (question.type === 'contour') {
      playNote(question.first, 'piano', 1.1);
      window.setTimeout(() => playNote(question.second, 'piano', 1.1), 850);
    } else {
      playNote(question.first, question.firstInstrument === 'guitar' ? 'steel' : question.firstInstrument, 1.4);
      window.setTimeout(() => playNote(question.second, question.secondInstrument === 'guitar' ? 'steel' : question.secondInstrument, 1.4), 1250);
    }
  }

  function makeSpeakingQuestion() {
    const midi = [60, 62, 64, 65, 67, 69, 71][Math.floor(Math.random() * 7)];
    return {
      type: 'pitch-match',
      midi,
      answer: noteName(midi),
      prompt: 'Dengarkan nada acuan, lalu coba humming dengan pitch yang sama.',
      explanation: 'Pitch matching berarti menghasilkan nada yang sedekat mungkin dengan nada acuan.'
    };
  }

  function renderQuestionHeader() {
    const total = sessions[currentMode];
    return '<div class="l-meta"><span>SOAL ' + (session.index + 1) + ' / ' + total + '</span><span>BENAR ' + session.correct + '</span></div>' +
      '<div class="l-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + session.index + '"><i style="width:' + (session.index / total * 100) + '%"></i></div>';
  }

  function renderQuestion() {
    if (!session || !session.questions.length) return;
    if (session.index >= session.questions.length) return finishSession();
    const q = session.questions[session.index];
    let content = renderQuestionHeader() + '<p class="l-prompt">' + q.prompt + '</p>';
    if (currentMode === 'reading') {
      content += '<div class="l-stage"><div class="l-reading-card"><span class="l-reading-symbol">♪</span><small>FOUNDATION CONCEPT</small><b>READ &amp; UNDERSTAND</b></div></div>';
      content += renderOptions(q);
    } else if (currentMode === 'listening') {
      content += '<div class="l-stage"><button class="l-play l-big-play" type="button" id="playQuestion">▶ Dengarkan contoh audio</button></div>';
      content += '<p class="l-hint">Audio tidak diputar otomatis. Tekan tombol untuk mendengar contoh, dan ulangi jika perlu.</p>';
      content += renderOptions(q);
    } else {
      content += '<div class="l-stage"><div class="l-target-note"><span>' + q.answer + '</span><small>TARGET PITCH</small></div></div>';
      content += '<div class="l-speaking-actions"><button class="l-play" type="button" id="playTarget">▶ Dengarkan nada acuan</button><button class="l-play" type="button" id="startPitch">● Mulai humming</button></div>';
      content += '<p class="l-hint">Mikrofon hanya aktif setelah tombol ditekan dan izin diberikan. Suara dianalisis sementara di perangkat, tidak direkam atau diunggah.</p>';
    }
    $('lab').innerHTML = content + '<p class="l-fb" id="feedback" aria-live="polite"></p><div id="nextQuestion"></div>';
    if (currentMode === 'reading' || currentMode === 'listening') {
      $('answers').addEventListener('click', event => {
        const button = event.target.closest('button[data-answer]');
        if (!button || button.disabled) return;
        answerQuestion(button.dataset.answer === String(q.answer), button, q.explanation);
      });
    }
    if ($('playQuestion')) $('playQuestion').addEventListener('click', () => playListeningQuestion(q));
    if ($('playTarget')) $('playTarget').addEventListener('click', () => playNote(q.midi, 'piano', 1.8));
    if ($('startPitch')) $('startPitch').addEventListener('click', () => runPitchMatch(q));
  }

  function renderOptions(q) {
    return '<div class="l-ans" id="answers">' + q.options.map(option =>
      '<button type="button" data-answer="' + String(option).replace(/"/g, '&quot;') + '">' + option + '</button>'
    ).join('') + '</div>';
  }

  function answerQuestion(correct, selectedButton, explanation, detectedName) {
    if (session.locked) return;
    session.locked = true;
    if (correct) session.correct++;
    const feedback = $('feedback');
    if (selectedButton) selectedButton.classList.add(correct ? 'ok' : 'bad');
    const answerButtons = document.querySelectorAll('#answers button');
    answerButtons.forEach(button => {
      button.disabled = true;
      if (button.dataset.answer === String(session.questions[session.index].answer)) button.classList.add('ok');
    });
    feedback.className = 'l-fb ' + (correct ? 'ok' : 'err');
    feedback.textContent = (correct ? 'Tepat. ' : 'Belum tepat. ') + (detectedName ? detectedName + ' · ' : '') + explanation;
    session.index++;
    const next = $('nextQuestion');
    next.innerHTML = '<button class="h-btn l-next" type="button">' +
      (session.index >= session.questions.length ? 'Lihat hasil' : 'Soal berikutnya') + ' <i>↗</i></button>';
    next.querySelector('button').addEventListener('click', renderQuestion);
  }

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
    const button = $('startPitch');
    button.disabled = true;
    button.textContent = '● Meminta izin mikrofon…';
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showMicError('Browser ini tidak menyediakan akses mikrofon. Gunakan browser modern melalui HTTPS atau localhost.');
      button.disabled = false;
      button.textContent = '● Coba lagi';
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      activeMicStream = stream;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = audioContext || new AudioContextClass();
      if (audioContext.state === 'suspended') await audioContext.resume();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      const readings = [];
      button.textContent = '● Dengarkan humming…';
      $('feedback').textContent = 'Humming nada dengan nyaman dan stabil selama beberapa detik.';
      const started = performance.now();
      await new Promise(resolve => {
        const sample = () => {
          if (performance.now() - started >= 3200) return resolve();
          analyser.getFloatTimeDomainData(buffer);
          const hz = detectPitchYIN(buffer, audioContext.sampleRate);
          if (hz && hz > 0) readings.push(69 + 12 * Math.log2(hz / 440));
          window.setTimeout(sample, 80);
        };
        sample();
      });
      const stableMidi = median(readings);
      stream.getTracks().forEach(track => track.stop());
      activeMicStream = null;
      source.disconnect();
      analyser.disconnect();
      if (stableMidi == null || readings.length < 5) {
        $('feedback').textContent = 'Nada belum terdeteksi dengan cukup stabil. Coba lagi di tempat yang lebih tenang dan humming secara berkelanjutan.';
        button.disabled = false;
        button.textContent = '● Coba lagi';
        return;
      }
      const nearest = Math.round(stableMidi);
      const cents = Math.round((stableMidi - nearest) * 100);
      const target = question.midi;
      const difference = stableMidi - target;
      const correct = Math.abs(difference) <= 0.5;
      const detected = noteName(nearest) + ' (' + (cents > 0 ? '+' : '') + cents + ' cents)';
      const detail = Math.abs(difference) <= 0.5
        ? 'Pitch kamu berada dekat dengan nada acuan ' + noteName(target) + '.'
        : difference > 0
          ? 'Pitch terdeteksi lebih tinggi dari target ' + noteName(target) + '. Coba turunkan sedikit.'
          : 'Pitch terdeteksi lebih rendah dari target ' + noteName(target) + '. Coba naikkan sedikit.';
      answerQuestion(correct, null, detail, 'Terdeteksi ' + detected + '.');
      button.textContent = 'Humming selesai';
    } catch (error) {
      if (stream) stream.getTracks().forEach(track => track.stop());
      activeMicStream = null;
      showMicError(error && error.name === 'NotAllowedError'
        ? 'Izin mikrofon ditolak. Kamu tetap bisa belajar tanpa mengaktifkan mikrofon.'
        : 'Mikrofon tidak dapat digunakan saat ini. Periksa izin browser dan coba lagi.');
      button.disabled = false;
      button.textContent = '● Coba lagi';
    }
  }

  function showMicError(message) {
    const feedback = $('feedback');
    if (feedback) {
      feedback.className = 'l-fb err';
      feedback.textContent = message;
    }
  }

  function startSession() {
    stopLessonAudio();
    session = {
      index: 0,
      correct: 0,
      locked: false,
      questions: Array.from({ length: sessions[currentMode] }, () => {
        if (currentMode === 'reading') return makeReadingQuestion();
        if (currentMode === 'listening') return makeListeningQuestion();
        return makeSpeakingQuestion();
      })
    };
    renderQuestion();
  }

  function saveScore(mode, percent, points) {
    const key = 'tsw_score_' + mode;
    let previous = null;
    try { previous = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) {}
    const oldPercent = previous
      ? Number(previous.percent != null ? previous.percent : parseFloat(previous.accuracy)) || 0
      : -1;
    if (percent < oldPercent) return;
    const record = mode === 'reading'
      ? { percent, score: points }
      : mode === 'listening'
        ? { accuracy: percent, score: points }
        : { accuracy: percent + '%', score: points + ' points', band: (percent / 100 * 9).toFixed(1) + ' / 9' };
    try {
      localStorage.setItem(key, JSON.stringify(record));
      localStorage.setItem('tsw_level0_' + mode, JSON.stringify({ percent, points, completedAt: new Date().toISOString() }));
    } catch (_) {}
    if (percent >= 70 && window.trackSoundProgress) {
      try { window.trackSoundProgress(mode); } catch (_) {}
    }
  }

  function updateProgress() {
    const holder = $('level0Progress');
    if (!holder) return;
    const labels = ['reading', 'listening', 'speaking'];
    const items = labels.map(mode => {
      let result = null;
      try { result = JSON.parse(localStorage.getItem('tsw_level0_' + mode) || 'null'); } catch (_) {}
      return { mode, percent: result ? Number(result.percent) : 0, completed: !!result && Number(result.percent) >= 70 };
    });
    holder.innerHTML = '<p class="l-no">YOUR LEVEL 0 PRACTICE RECORD</p><div class="l-progress-cards">' +
      items.map(item => '<div><b>' + item.mode.toUpperCase() + '</b><span>' + (item.completed ? 'Completed' : 'In progress') + '</span><i><em style="width:' + Math.max(0, Math.min(100, item.percent)) + '%"></em></i><small>' + item.percent + '% best score</small></div>').join('') +
      '</div><p class="l-hint">Jalur latihan ditandai selesai jika skor terbaik mencapai minimal 70%. Catatan tersimpan secara lokal di browser ini.</p>';
  }

  function finishSession() {
    const total = session.questions.length;
    const percent = Math.round(session.correct / total * 100);
    const points = session.correct * 10;
    saveScore(currentMode, percent, points);
    $('lab').innerHTML = '<div class="l-result"><p class="l-meta"><span>SESSION COMPLETE</span><span>' + points + ' POINTS</span></p>' +
      '<div class="l-score">' + percent + '%</div><p class="l-fb">' + session.correct + ' dari ' + total + ' jawaban benar.</p>' +
      '<p class="l-result-note">' + (percent >= 70 ? 'Bagus. Jalur ini mencapai kriteria penyelesaian Level 0.' : 'Ulangi sesi dengan soal baru untuk memperkuat pemahamanmu. Target penyelesaian adalah 70%.') + '</p>' +
      '<button class="h-btn" type="button" id="again">Sesi baru, soal baru <i>↗</i></button></div>';
    $('again').addEventListener('click', startSession);
    updateProgress();
  }

  document.querySelectorAll('.l-tabs [role="tab"]').forEach(tab => {
    tab.addEventListener('click', () => {
      currentMode = tab.dataset.mode;
      document.querySelectorAll('.l-tabs [role="tab"]').forEach(item => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.classList.toggle('active', active);
      });
      startSession();
    });
  });

  renderLessonGuides();
  buildNaturalNotes();
  buildLessonKeyboard();
  buildMiniGuitar();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopLessonAudio();
  });

  updateProgress();
  startSession();
})();
