const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbx1k5-gJBfAkO5xvl-bX8onzOrL-aKB3UzMPzyEPRvJ3Qb64eXxtHPmATL8fLccBDVD/exec";

// Ambil semua elemen dari HTML
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const snapButton = document.getElementById("snap");
const capturedImage = document.getElementById("captured-image");
const attendanceForm = document.getElementById("attendance-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const himpunanInput = document.getElementById("himpunan");

// === PERUBAHAN: Ambil elemen select ===
const statusSelect = document.getElementById("status-select");
// ===================================

const submitButton = document.getElementById("submit-btn");
const statusDiv = document.getElementById("status");
const loader = document.getElementById("loader");
let imageDataURL = null;

// Fungsi startCamera() dan snapButton.addEventListener() tetap sama
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        // Karena kamera di bawah, beri notifikasi di status div
        const statusDiv = document.getElementById("status");
        statusDiv.textContent = "Error: Kamera tidak bisa diakses.";
        statusDiv.className = "status error";
    }
}

// GANTI SELURUH BLOK FUNGSI INI DENGAN YANG BARU
snapButton.addEventListener('click', function() {
    const context = canvas.getContext('2d');

    // Menghitung rasio target (9:16) dan cropping video
    const targetAspectRatio = 9.0 / 16.0;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const videoAspectRatio = videoWidth / videoHeight;
    let drawX = 0, drawY = 0, sourceWidth = videoWidth, sourceHeight = videoHeight;

    if (videoAspectRatio > targetAspectRatio) {
        sourceWidth = videoHeight * targetAspectRatio;
        drawX = (videoWidth - sourceWidth) / 2;
    } else {
        sourceHeight = videoWidth / targetAspectRatio;
        drawY = (videoHeight - sourceHeight) / 2;
    }

    // --- LOGIKA BARU UNTUK MIRRORING FOTO DIMULAI DI SINI ---

    // Langkah 1: Simpan kondisi kanvas saat ini (yang masih normal)
    context.save();

    // Langkah 2: Balik kanvas secara horizontal untuk menciptakan efek cermin
    context.translate(canvas.width, 0);
    context.scale(-1, 1);

    // Langkah 3: Gambar foto wajah yang sudah di-crop ke kanvas yang sudah terbalik
    context.drawImage(
        video,
        drawX, drawY, sourceWidth, sourceHeight,
        0, 0, canvas.width, canvas.height
    );

    // Langkah 4: Kembalikan kanvas ke kondisi normal agar frame tidak ikut terbalik
    context.restore();

    // --- LOGIKA MIRRORING FOTO SELESAI ---


    // Langkah 5: Gambar frame (yang normal) di atas kanvas yang sudah berisi foto terbalik
    const frameImage = new Image();
    frameImage.onload = function() {
        context.drawImage(frameImage, 0, 0, canvas.width, canvas.height);

        // Kode selanjutnya untuk menyimpan dan menampilkan hasil akhir tetap sama
        imageDataURL = canvas.toDataURL('image/png');
        capturedImage.src = imageDataURL;
        capturedImage.style.display = 'block';
        video.style.display = 'none';
        snapButton.innerHTML = '✔ Foto Diambil';
    };
    frameImage.src = 'frame-9-16.png'; // Pastikan path ini benar
});

// Fungsi untuk mengirim form
attendanceForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // === PERUBAHAN: Validasi untuk dropdown ===
    if (statusSelect.value === "") {
        alert("Silakan pilih status Anda (Mahasiswa/Dosen)!");
        return;
    }
    // =======================================

    // Validasi lainnya
    if (nameInput.value.trim() === "" || emailInput.value.trim() === "") {
        alert("Nama dan Email wajib diisi!");
        return;
    }
    if (!imageDataURL) {
        alert("Silakan ambil foto terlebih dahulu!");
        return;
    }

    submitButton.style.display = "none";
    loader.style.display = "block";
    statusDiv.textContent = "";
    statusDiv.className = "status";

    // === PERUBAHAN: Ambil value dari select ===
    const payload = {
        name: nameInput.value,
        email: emailInput.value,
        status: statusSelect.value, // Menggunakan value dari dropdown
        himpunan: himpunanInput.value,
        photo: imageDataURL,
    };
    // ======================================

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                statusDiv.textContent = "Registrasi Berhasil Terkirim!";
                statusDiv.className = "status success";
                attendanceForm.reset();
                capturedImage.style.display = "none";
                video.style.display = "block";
                imageDataURL = null;
                snapButton.innerHTML =
                    '<i class="fa-solid fa-camera-retro"></i> Ambil Foto'; // Reset tombol foto
            } else {
                throw new Error(data.message || "Terjadi kesalahan pada server.");
            }
        })
        .catch((error) => {
            console.error("Error:", error);
            statusDiv.textContent = "Gagal Mengirim. Coba lagi.";
            statusDiv.className = "status error";
        })
        .finally(() => {
            submitButton.style.display = "flex";
            loader.style.display = "none";
        });
});

window.addEventListener("load", startCamera);
