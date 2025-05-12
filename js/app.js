/**
 * Menulis pesan log ke area debug di HTML dan juga ke console browser.
 * @param {string} message - Pesan yang akan di-log.
 */
function logToPwaDebug(message) {
    const debugOutputEl = document.getElementById('debugOutput');
    if (debugOutputEl) {
        const timestamp = new Date().toLocaleTimeString('id-ID', { hour12: false });
        debugOutputEl.textContent += `[${timestamp}] ${message}\n`;
        const debugArea = debugOutputEl.parentElement;
        if (debugArea) {
            debugArea.scrollTop = debugArea.scrollHeight;
        }
    }
    console.log(`[PWA MetaLog ${new Date().toLocaleTimeString('id-ID', { hour12: false })}] ${message}`);
}

logToPwaDebug("app.js (Meta Variables & Updater) parsing started.");
document.title = "AT Meta PWA - Loading...";

// Variabel global untuk state game sederhana kita
let currentPlayerATK;
let currentEnemyHP;
let currentEnemyMaxHP;
let gamePlayerName;

// =============================================================
// PERUBAHAN DI SINI: Deklarasi fungsi autoToolsUpdateValues
// Menggunakan 'var' di scope global, mirip dengan demo AutoTools
// =============================================================
var autoToolsUpdateValues = function(values) {
    logToPwaDebug("Fungsi GLOBAL autoToolsUpdateValues dipanggil oleh Tasker.");
    logToPwaDebug("Data yang diterima (values): " + JSON.stringify(values));

    // Ambil referensi elemen di dalam fungsi ini agar selalu terupdate jika ada perubahan DOM (meskipun sebaiknya tidak)
    const displayRealtimeEl = document.getElementById('displayRealtimeUpdate');
    const gameStatusEl = document.getElementById('gameStatus');
    const gameEnemyHPEl = document.getElementById('gameEnemyHP'); // Pastikan elemen ini ada

    // Skenario: Tasker mengupdate nilai 'realtimeUpdateValue'
    if (typeof values.realtimeUpdateValue !== 'undefined') {
        logToPwaDebug(`Nilai realtimeUpdateValue diupdate menjadi: "${values.realtimeUpdateValue}"`);
        if (displayRealtimeEl) {
            displayRealtimeEl.textContent = `Update dari Tasker: ${values.realtimeUpdateValue}`;
        }
    }

    // Skenario: Tasker mengupdate HP Musuh secara langsung
    if (typeof values.enemyHP !== 'undefined') {
        // Pastikan currentEnemyHP dan currentEnemyMaxHP sudah diinisialisasi (biasanya di DOMContentLoaded)
        if (typeof currentEnemyHP === 'undefined' || typeof currentEnemyMaxHP === 'undefined') {
            logToPwaDebug("ERROR: currentEnemyHP atau currentEnemyMaxHP belum diinisialisasi sebelum update.");
            // Mungkin perlu mengambil nilai saat ini dari DOM jika belum ada di variabel JS
             const hpElement = document.getElementById('gameEnemyHP');
             const maxHpElement = document.getElementById('gameEnemyMaxHP');
             if (hpElement) currentEnemyHP = parseInt(hpElement.textContent, 10) || 0; // Ambil dari DOM jika perlu
             if (maxHpElement) currentEnemyMaxHP = parseInt(maxHpElement.textContent, 10) || 100; // Ambil dari DOM jika perlu
        }

        const newEnemyHP = parseInt(values.enemyHP, 10);
        if (!isNaN(newEnemyHP)) {
            currentEnemyHP = newEnemyHP;
            // Pastikan tidak melebihi MaxHP jika ada logika heal, atau tidak kurang dari 0
            // Juga pastikan currentEnemyMaxHP adalah angka yang valid
             if (isNaN(currentEnemyMaxHP)) { currentEnemyMaxHP = currentEnemyHP; } // Fallback jika MaxHP tidak valid
            currentEnemyHP = Math.max(0, Math.min(currentEnemyHP, currentEnemyMaxHP));

            logToPwaDebug(`HP Musuh diupdate oleh Tasker menjadi: ${currentEnemyHP}`);
            if (gameEnemyHPEl) gameEnemyHPEl.textContent = currentEnemyHP; // Update tampilan HP
            if (gameStatusEl) gameStatusEl.textContent = `HP Musuh diupdate Tasker menjadi ${currentEnemyHP}.`;

            // Cek kondisi menang jika HP musuh jadi 0 karena update Tasker
            const attackButton = document.getElementById('attackButton'); // Perlu referensi button lagi
            if (currentEnemyHP <= 0) {
                if (gameStatusEl) gameStatusEl.textContent = "Musuh dikalahkan oleh intervensi Tasker! KAMU MENANG!";
                 if (attackButton) attackButton.disabled = true;
                logToPwaDebug("Musuh dikalahkan (HP <= 0) setelah update dari Tasker.");
            } else {
                 if (attackButton) attackButton.disabled = false; // Aktifkan lagi jika HP > 0
            }
        } else {
            logToPwaDebug(`Nilai enemyHP dari Tasker tidak valid: "${values.enemyHP}"`);
        }
    }
};
// =============================================================
// AKHIR PERUBAHAN Deklarasi fungsi autoToolsUpdateValues
// =============================================================


document.addEventListener('DOMContentLoaded', () => {
    logToPwaDebug("DOMContentLoaded event fired.");
    document.title = "AT Meta PWA - Ready";

    // Ambil referensi elemen HTML
    const displayInitialMessageEl = document.getElementById('displayInitialMessage');
    const displayPlayerNameEl = document.getElementById('displayPlayerName');
    const gamePlayerNameEl = document.getElementById('gamePlayerName');
    const gamePlayerATKEl = document.getElementById('gamePlayerATK');
    const gameEnemyHPEl = document.getElementById('gameEnemyHP');
    const gameEnemyMaxHPEl = document.getElementById('gameEnemyMaxHP');
    const attackButton = document.getElementById('attackButton');
    const gameStatusEl = document.getElementById('gameStatus');
    const displayRealtimeUpdateEl = document.getElementById('displayRealtimeUpdate');


    // --- 1. Menerima Data Awal dari Tasker (via <meta> tag AutoTools) ---
    // Variabel ini akan otomatis ada di scope global (window) jika didefinisikan di <meta>
    // dan diisi nilainya oleh Tasker di konfigurasi "Screen Variables".

    // Pesan Awal
    if (typeof window.initialMessage !== 'undefined') {
        logToPwaDebug(`initialMessage dari Tasker: "${window.initialMessage}"`);
        if (displayInitialMessageEl) displayInitialMessageEl.textContent = window.initialMessage;
    } else {
        logToPwaDebug("window.initialMessage TIDAK DITEMUKAN (cek meta tag & config Tasker).");
        if (displayInitialMessageEl) displayInitialMessageEl.textContent = "initialMessage tidak diset.";
    }

    // Nama Pemain
    if (typeof window.playerName !== 'undefined') {
        gamePlayerName = window.playerName; // Simpan ke variabel global PWA
        logToPwaDebug(`playerName dari Tasker: "${gamePlayerName}"`);
        if (displayPlayerNameEl) displayPlayerNameEl.textContent = gamePlayerName;
        if (gamePlayerNameEl) gamePlayerNameEl.textContent = gamePlayerName;
    } else {
        gamePlayerName = "Pemain Default";
        logToPwaDebug("window.playerName TIDAK DITEMUKAN. Menggunakan default: " + gamePlayerName);
        if (displayPlayerNameEl) displayPlayerNameEl.textContent = gamePlayerName + " (default)";
        if (gamePlayerNameEl) gamePlayerNameEl.textContent = gamePlayerName;
    }

    // HP Musuh Awal
    if (typeof window.enemyHP !== 'undefined') {
        currentEnemyHP = parseInt(window.enemyHP, 10);
        if (isNaN(currentEnemyHP)) currentEnemyHP = 100; // Fallback jika parsing gagal
        currentEnemyMaxHP = currentEnemyHP; // Asumsikan HP awal adalah MaxHP
        logToPwaDebug(`enemyHP dari Tasker: ${currentEnemyHP}`);
    } else {
        currentEnemyHP = 100; // Default jika tidak diset
        currentEnemyMaxHP = 100;
        logToPwaDebug("window.enemyHP TIDAK DITEMUKAN. Menggunakan default: " + currentEnemyHP);
    }
    // Pastikan nilai awal ditampilkan
    if (gameEnemyHPEl) gameEnemyHPEl.textContent = currentEnemyHP;
    if (gameEnemyMaxHPEl) gameEnemyMaxHPEl.textContent = currentEnemyMaxHP;


    // ATK Pemain
    if (typeof window.playerATK !== 'undefined') {
        currentPlayerATK = parseInt(window.playerATK, 10);
         if (isNaN(currentPlayerATK)) currentPlayerATK = 10; // Fallback
        logToPwaDebug(`playerATK dari Tasker: ${currentPlayerATK}`);
    } else {
        currentPlayerATK = 10; // Default
        logToPwaDebug("window.playerATK TIDAK DITEMUKAN. Menggunakan default: " + currentPlayerATK);
    }
    if (gamePlayerATKEl) gamePlayerATKEl.textContent = currentPlayerATK;

    // Nilai Update Realtime Awal (dari meta tag, sebelum ada update dari Tasker)
     if (typeof window.realtimeUpdateValue !== 'undefined') {
        logToPwaDebug(`realtimeUpdateValue awal dari Tasker: "${window.realtimeUpdateValue}"`);
        if (displayRealtimeUpdateEl) displayRealtimeUpdateEl.textContent = `Nilai awal: ${window.realtimeUpdateValue}`; // Sedikit modifikasi teks
    } else {
        logToPwaDebug("window.realtimeUpdateValue TIDAK DITEMUKAN (cek meta tag & config Tasker).");
        if (displayRealtimeUpdateEl) displayRealtimeUpdateEl.textContent = "realtimeUpdateValue tidak diset awal.";
    }


    // --- Logika Game Sederhana ---
    if (attackButton) {
        attackButton.addEventListener('click', () => {
            if (currentEnemyHP <= 0) {
                logToPwaDebug("Tombol serang diklik, tapi musuh sudah kalah.");
                return;
            }

            logToPwaDebug(`Tombol SERANG diklik! Pemain ATK: ${currentPlayerATK}, Musuh HP sebelum: ${currentEnemyHP}`);
            currentEnemyHP -= currentPlayerATK;
            currentEnemyHP = Math.max(0, currentEnemyHP); // Pastikan HP tidak negatif

            if (gameEnemyHPEl) gameEnemyHPEl.textContent = currentEnemyHP;
            logToPwaDebug(`Musuh HP setelah diserang: ${currentEnemyHP}`);

            if (currentEnemyHP <= 0) {
                if (gameStatusEl) gameStatusEl.textContent = "Musuh Kalah! KAMU MENANG!";
                attackButton.disabled = true;
                logToPwaDebug("Musuh dikalahkan (HP <= 0) oleh serangan pemain.");
                // Di sini Anda bisa mengirim command ke Tasker bahwa pemain menang
                // if (window.AutoTools && typeof window.AutoTools.sendCommand === 'function') {
                //     window.AutoTools.sendCommand("Menang", "GameResult", null);
                // }
            } else {
                if (gameStatusEl) gameStatusEl.textContent = `Musuh menerima ${currentPlayerATK} damage. Sisa HP: ${currentEnemyHP}.`;
            }
        });
        logToPwaDebug("Event listener untuk attackButton berhasil ditambahkan.");
    } else {
        logToPwaDebug("ERROR: attackButton tidak ditemukan!");
    }

    // Pastikan status awal game benar
    if (gameStatusEl && currentEnemyHP > 0) {
        gameStatusEl.textContent = "Status: Mulai pertarungan!";
    } else if (gameStatusEl && currentEnemyHP <= 0) {
         gameStatusEl.textContent = "Musuh sudah kalah saat load!";
         if (attackButton) attackButton.disabled = true;
    }

});

logToPwaDebug("app.js (Meta Variables & Updater) parsing finished.");
