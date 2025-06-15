const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzEuWU2esRzKgT8K_KpzXUd0vt2wx5KoqiqVB3ChupWtHulJuxh7zu8V93zM5d314YB/exec';

// Ambil semua elemen dari HTML
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapButton = document.getElementById('snap');
const capturedImage = document.getElementById('captured-image');
const attendanceForm = document.getElementById('attendance-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const himpunanInput = document.getElementById('himpunan');

// === PERUBAHAN: Ambil elemen select ===
const statusSelect = document.getElementById('status-select');
// ===================================

const submitButton = document.getElementById('submit-btn');
const statusDiv = document.getElementById('status');
const loader = document.getElementById('loader');
let imageDataURL = null;

// Fungsi startCamera() dan snapButton.addEventListener() tetap sama
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        // Karena kamera di bawah, beri notifikasi di status div
        const statusDiv = document.getElementById('status');
        statusDiv.textContent = "Error: Kamera tidak bisa diakses.";
        statusDiv.className = 'status error';
    }
}

snapButton.addEventListener('click', function() {
    const context = canvas.getContext('2d');

    // Menghitung rasio yang kita inginkan (3:4)
    const targetAspectRatio = 3.0 / 4.0;

    // Mengambil dimensi asli dari sumber video
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const videoAspectRatio = videoWidth / videoHeight;

    let drawX = 0;
    let drawY = 0;
    let sourceWidth = videoWidth;
    let sourceHeight = videoHeight;

    // Logika untuk "memotong" (crop) sumber video secara virtual
    if (videoAspectRatio > targetAspectRatio) {
        // Jika video lebih lebar dari target (misal 16:9), potong sisi kiri-kanan
        sourceWidth = videoHeight * targetAspectRatio;
        drawX = (videoWidth - sourceWidth) / 2;
    } else {
        // Jika video lebih tinggi dari target, potong sisi atas-bawah
        sourceHeight = videoWidth / targetAspectRatio;
        drawY = (videoHeight - sourceHeight) / 2;
    }

    // Menggambar hasil crop ke kanvas
    context.drawImage(
        video,          // Sumber gambar
        drawX,          // Titik mulai X di sumber
        drawY,          // Titik mulai Y di sumber
        sourceWidth,    // Lebar area yang diambil dari sumber
        sourceHeight,   // Tinggi area yang diambil dari sumber
        0,              // Titik X untuk menggambar di kanvas
        0,              // Titik Y untuk menggambar di kanvas
        canvas.width,   // Lebar gambar di kanvas
        canvas.height   // Tinggi gambar di kanvas
    );

    // Kode selanjutnya tetap sama
    imageDataURL = canvas.toDataURL('image/jpeg');
    capturedImage.src = imageDataURL;
    capturedImage.style.display = 'block';
    video.style.display = 'none';
    snapButton.innerHTML = '✔ Foto Diambil'; // Beri feedback
});

// Fungsi untuk mengirim form
attendanceForm.addEventListener('submit', function(event) {
    event.preventDefault();

    // === PERUBAHAN: Validasi untuk dropdown ===
    if (statusSelect.value === '') {
        alert('Silakan pilih status Anda (Mahasiswa/Dosen)!');
        return;
    }
    // =======================================
    
    // Validasi lainnya
    if (nameInput.value.trim() === '' || emailInput.value.trim() === '') {
        alert('Nama dan Email wajib diisi!');
        return;
    }
    if (!imageDataURL) {
        alert('Silakan ambil foto terlebih dahulu!');
        return;
    }

    submitButton.style.display = 'none';
    loader.style.display = 'block';
    statusDiv.textContent = '';
    statusDiv.className = 'status';

    // === PERUBAHAN: Ambil value dari select ===
    const payload = {
        name: nameInput.value,
        email: emailInput.value,
        status: statusSelect.value, // Menggunakan value dari dropdown
        himpunan: himpunanInput.value,
        photo: imageDataURL
    };
    // ======================================

    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            statusDiv.textContent = 'Registrasi Berhasil Terkirim!';
            statusDiv.className = 'status success';
            attendanceForm.reset();
            capturedImage.style.display = 'none';
            video.style.display = 'block';
            imageDataURL = null;
            snapButton.innerHTML = '<i class="fa-solid fa-camera-retro"></i> Ambil Foto'; // Reset tombol foto
        } else {
            throw new Error(data.message || 'Terjadi kesalahan pada server.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        statusDiv.textContent = 'Gagal Mengirim. Coba lagi.';
        statusDiv.className = 'status error';
    })
    .finally(() => {
        submitButton.style.display = 'flex';
        loader.style.display = 'none';
    });
});

window.addEventListener('load', startCamera);