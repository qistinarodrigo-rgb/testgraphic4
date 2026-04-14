// ========== FIREBASE CONFIG ==========
// db dah initialize dalam HTML

// Global variable
var aduanList = [];
var isLoading = false;

// ========== STAFF DIREKTORI ==========
var staffDirektori = [
    { 
        id: 1,
        nama: 'Encik Wan Mohd Faris bin Wan Razali', 
        jawatan: 'Pembantu Keselamatan', 
        telefon: '013-950 5396', 
        gambar: "images/faris3.png"
    }
];

// ========== NOTIFICATION FUNCTION ==========
function showNotification(message, isSuccess) {
    if (isSuccess === undefined) isSuccess = true;
    
    var existingNotif = document.querySelector('.notification-popup-top');
    if (existingNotif) {
        existingNotif.remove();
    }
    
    var notif = document.createElement('div');
    notif.className = 'notification-popup-top ' + (isSuccess ? '' : 'error');
    notif.innerHTML = isSuccess ? '✅ ' + message : '❌ ' + message;
    notif.style.cssText = 'position: fixed !important; top: 20px !important; left: 50% !important; transform: translateX(-50%) !important; background-color: ' + (isSuccess ? '#10b981' : '#ef4444') + ' !important; color: white !important; padding: 15px 25px !important; border-radius: 50px !important; box-shadow: 0 4px 15px rgba(0,0,0,0.2) !important; z-index: 999999 !important; font-weight: 500 !important; font-size: 16px !important; text-align: center !important; max-width: 90% !important; animation: slideDown 0.3s ease !important; pointer-events: none !important; border: 1px solid rgba(255,255,255,0.3) !important;';
    document.body.appendChild(notif);
    
    setTimeout(function() {
        notif.style.opacity = '0';
        notif.style.transition = 'opacity 0.5s';
        setTimeout(function() {
            if (notif.parentNode) notif.remove();
        }, 500);
    }, 3000);
}

// ========== LOAD SEMUA ADUAN (UNTUK ADMIN) ==========
function loadAduan() {
    if (isLoading) return Promise.resolve([]);
    isLoading = true;
    
    var timeoutPromise = new Promise(function(resolve, reject) {
        setTimeout(function() { reject(new Error('Timeout - Sila semak sambungan internet')); }, 15000);
    });
    
    var queryPromise = db.collection('aduan').orderBy('tarikh', 'desc').get();
    
    return Promise.race([queryPromise, timeoutPromise])
        .then(function(snapshot) {
            var aduan = [];
            snapshot.forEach(function(doc) {
                var data = doc.data();
                data.id = doc.id;
                aduan.push(data);
            });
            isLoading = false;
            return aduan;
        })
        .catch(function(error) {
            console.error('Error loading aduan:', error);
            showNotification(error.message || 'Gagal memuatkan aduan', false);
            isLoading = false;
            return [];
        });
}

// ========== LOAD 20 ADUAN TERBARU (UNTUK USER) ==========
function loadAduanByUser(email) {
    if (isLoading) return Promise.resolve([]);
    isLoading = true;
    
    var timeoutPromise = new Promise(function(resolve, reject) {
        setTimeout(function() { reject(new Error('Timeout - Sila semak sambungan internet')); }, 10000);
    });
    
    var queryPromise = db.collection('aduan')
        .where('userEmail', '==', email)
        .orderBy('tarikh', 'desc')
        .limit(20)
        .get();
    
    return Promise.race([queryPromise, timeoutPromise])
        .then(function(snapshot) {
            var aduan = [];
            snapshot.forEach(function(doc) {
                var data = doc.data();
                data.id = doc.id;
                aduan.push(data);
            });
            isLoading = false;
            return aduan;
        })
        .catch(function(error) {
            console.error('Error loading aduan by user:', error);
            showNotification(error.message || 'Gagal memuatkan aduan anda', false);
            isLoading = false;
            return [];
        });
}

// ========== SAVE TO FIREBASE ==========
function saveAduanToFirebase(aduan) {
    return db.collection('aduan').add(aduan)
        .then(function(docRef) { return docRef.id; })
        .catch(function(error) {
            console.error('Error saving aduan:', error);
            throw error;
        });
}

// ========== DELETE FROM FIREBASE ==========
function deleteAduanFromFirebase(id) {
    return db.collection('aduan').doc(id).delete()
        .catch(function(error) {
            console.error('Error deleting aduan:', error);
            throw error;
        });
}

// ========== UPDATE STATUS ==========
function updateAduanStatus(id, selesai) {
    return db.collection('aduan').doc(id).update({ selesai: selesai })
        .catch(function(error) {
            console.error('Error updating aduan:', error);
            throw error;
        });
}

// ========== LOGIN SYSTEM ==========
function checkLogin() {
    var isLoggedIn = localStorage.getItem('isLoggedIn');
    var userType = localStorage.getItem('userType');
    var userEmail = localStorage.getItem('userEmail');
    var lastPage = localStorage.getItem('lastPage') || 'home';
    
    if (isLoggedIn === 'true') {
        showApp(userType, userEmail);
        setTimeout(function() {
            setActivePage(lastPage);
        }, 100);
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

function showApp(userType, userEmail) {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
    
    var userDisplay = document.getElementById('userDisplay');
    var userBadge = document.getElementById('userBadge');
    
    if (userType === 'admin') {
        userDisplay.innerHTML = '<strong>Admin</strong> (' + userEmail + ')';
        userBadge.innerHTML = '<i class="fas fa-shield-alt"></i> Admin';
        updateSidebarForAdmin();
        updateBottomNavForAdmin();
    } else {
        userDisplay.innerHTML = '<strong>User</strong> (' + userEmail + ')';
        userBadge.innerHTML = '<i class="fas fa-user"></i> User';
        updateSidebarForUser();
        updateBottomNavForUser();
    }
}

function updateSidebarForAdmin() {
    var sidebarMenu = document.querySelector('.sidebar-menu');
    sidebarMenu.innerHTML = '<div class="sidebar-item" data-page="home"><i class="fas fa-home"></i><span>Home</span></div><div class="sidebar-item" data-page="aduan"><i class="fas fa-pen-alt"></i><span>Aduan</span></div><div class="sidebar-item" data-page="status"><i class="fas fa-check-circle"></i><span>Status</span></div><div class="sidebar-item" data-page="direktori"><i class="fas fa-address-book"></i><span>Direktori</span></div>';
    refreshSidebarListeners();
}

function updateSidebarForUser() {
    var sidebarMenu = document.querySelector('.sidebar-menu');
    sidebarMenu.innerHTML = '<div class="sidebar-item" data-page="home"><i class="fas fa-home"></i><span>Home</span></div><div class="sidebar-item" data-page="aduan"><i class="fas fa-pen-alt"></i><span>Aduan</span></div><div class="sidebar-item" data-page="direktori"><i class="fas fa-address-book"></i><span>Direktori</span></div>';
    refreshSidebarListeners();
}

function updateBottomNavForAdmin() {
    var bottomNav = document.querySelector('.bottom-nav');
    bottomNav.innerHTML = '<button class="nav-item" data-page="aduan"><i class="fas fa-pen-alt"></i><span>Aduan</span></button><button class="nav-item" data-page="status"><i class="fas fa-check-circle"></i><span>Status</span></button>';
    refreshNavListeners();
}

function updateBottomNavForUser() {
    var bottomNav = document.querySelector('.bottom-nav');
    bottomNav.innerHTML = '<button class="nav-item" data-page="home"><i class="fas fa-home"></i><span>Home</span></button><button class="nav-item" data-page="aduan"><i class="fas fa-pen-alt"></i><span>Aduan</span></button>';
    refreshNavListeners();
}

function refreshSidebarListeners() {
    var items = document.querySelectorAll('.sidebar-item');
    for (var i = 0; i < items.length; i++) {
        items[i].onclick = function() {
            setActivePage(this.getAttribute('data-page'));
        };
    }
}

function refreshNavListeners() {
    var items = document.querySelectorAll('.nav-item');
    for (var i = 0; i < items.length; i++) {
        items[i].onclick = function() {
            setActivePage(this.getAttribute('data-page'));
        };
    }
}

// MOH login
document.getElementById('mohLoginBtn').onclick = function() {
    var email = document.getElementById('mohEmail').value.trim();
    var password = document.getElementById('mohPassword').value;
    
    if (!email || !password) {
        alert('Sila masukkan email dan password');
        return;
    }
    
    if (email.indexOf('@moh.gov.my') === -1) {
        alert('Email MOH mesti berakhir dengan @moh.gov.my');
        return;
    }
    
    var userType = '';
    if (password === 'admin123') {
        userType = 'admin';
    } else if (password === 'user123') {
        userType = 'user';
    } else {
        alert('Kata Laluan tidak tepat!');
        return;
    }
    
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userType', userType);
    localStorage.setItem('userEmail', email);
    
    showApp(userType, email);
    setActivePage('home');
};

// Logout
document.getElementById('logoutBtn').onclick = function() {
    localStorage.clear();
    showLogin();
    document.getElementById('mohEmail').value = '';
    document.getElementById('mohPassword').value = '';
};

// DOM elements
var sidebar = document.getElementById('sidebar');
var menuBtn = document.getElementById('menuBtn');
var closeBtn = document.getElementById('closeSidebar');
var overlay = document.getElementById('overlay');
var content = document.getElementById('content');
var pageTitle = document.getElementById('pageTitle');

menuBtn.onclick = function() {
    sidebar.className = sidebar.className + ' open';
    overlay.className = overlay.className + ' active';
};

closeBtn.onclick = function() {
    sidebar.className = sidebar.className.replace(' open', '');
    overlay.className = overlay.className.replace(' active', '');
};

overlay.onclick = function() {
    sidebar.className = sidebar.className.replace(' open', '');
    overlay.className = overlay.className.replace(' active', '');
};

function setActivePage(page) {
    localStorage.setItem('lastPage', page);
    
    var sidebarItems = document.querySelectorAll('.sidebar-item');
    for (var i = 0; i < sidebarItems.length; i++) {
        var item = sidebarItems[i];
        if (item.getAttribute('data-page') === page) {
            item.className = item.className + ' active';
        } else {
            item.className = item.className.replace(' active', '');
        }
    }
    
    var navItems = document.querySelectorAll('.nav-item');
    for (var i = 0; i < navItems.length; i++) {
        var item = navItems[i];
        if (item.getAttribute('data-page') === page) {
            item.className = item.className + ' active';
        } else {
            item.className = item.className.replace(' active', '');
        }
    }
    
    if (page === 'home') pageTitle.textContent = 'Home';
    else if (page === 'aduan') pageTitle.textContent = 'Aduan';
    else if (page === 'status') pageTitle.textContent = 'Status';
    else if (page === 'direktori') pageTitle.textContent = 'Direktori';
    
    renderPage(page);
    
    if (window.innerWidth <= 768) {
        sidebar.className = sidebar.className.replace(' open', '');
        overlay.className = overlay.className.replace(' active', '');
    }
}

function renderPage(page) {
    var userType = localStorage.getItem('userType');
    
    if (page === 'home') renderHome(userType);
    else if (page === 'aduan') renderAduan(userType);
    else if (page === 'status') renderStatus();
    else if (page === 'direktori') renderDirektori();
}

// ========== HOME PAGE ==========
function renderHome(userType) {
    var html = '<div class="home-container"><div class="home-header-card"><div class="header-background"><img src="images/logohosp2.png" alt="Hospital Banting"><div class="header-overlay"></div></div><div class="header-content"><div class="profile-section"><div class="profile-image"><img src="images/profile uk4.png" alt="Hospital Icon"></div></div></div></div>';
    
    if (userType === 'admin') {
        html += '<div class="stats-grid"><div class="stat-card"><div class="stat-icon blue"><i class="fas fa-pen-alt"></i></div><div class="stat-details"><span class="stat-value">' + aduanList.length + '</span><span class="stat-label">Jumlah Aduan</span></div></div><div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-details"><span class="stat-value">' + aduanList.filter(function(a) { return a.selesai; }).length + '</span><span class="stat-label">Selesai</span></div></div><div class="stat-card"><div class="stat-icon orange"><i class="fas fa-clock"></i></div><div class="stat-details"><span class="stat-value">' + aduanList.filter(function(a) { return !a.selesai; }).length + '</span><span class="stat-label">Dalam Proses</span></div></div><div class="stat-card"><div class="stat-icon purple"><i class="fas fa-users"></i></div><div class="stat-details"><span class="stat-value">' + staffDirektori.length + '</span><span class="stat-label">Staf Keselamatan</span></div></div></div><div class="recent-section"><div class="section-header"><h3>Aduan Terkini</h3><button class="view-all" onclick="setActivePage(\'aduan\')">Lihat Semua <i class="fas fa-arrow-right"></i></button></div><div class="recent-list">';
        
        var recentAduan = aduanList.slice(0, 3);
        for (var i = 0; i < recentAduan.length; i++) {
            var a = recentAduan[i];
            html += '<div class="recent-item"><div class="recent-icon ' + (a.selesai ? 'completed' : 'pending') + '"><i class="fas ' + (a.selesai ? 'fa-check' : 'fa-clock') + '"></i></div><div class="recent-details"><h4>' + a.jenis + '</h4><p><i class="fas fa-user"></i> ' + a.nama + ' • <i class="fas fa-map-marker-alt"></i> ' + a.lokasi + '</p><small><i class="fas fa-calendar"></i> ' + a.tarikh + ' ' + a.masa + '</small></div><span class="recent-status ' + (a.selesai ? 'completed' : 'pending') + '">' + (a.selesai ? 'Selesai' : 'Proses') + '</span></div>';
        }
        if (aduanList.length === 0) html += '<p style="text-align: center; color: #999; padding: 20px;">Tiada aduan buat masa ini</p>';
        html += '</div></div>';
    } else {
        html += '<div class="quick-actions"><h3>Tindakan Pantas</h3><div class="action-buttons"><button class="action-btn" onclick="setActivePage(\'aduan\')"><i class="fas fa-plus-circle"></i><span>Buat Aduan</span></button><button class="action-btn" onclick="setActivePage(\'direktori\')"><i class="fas fa-address-book"></i><span>Hubungi Staf</span></button></div></div>';
    }
    
    html += '</div>';
    content.innerHTML = html;
}

// ========== ADUAN PAGE ==========
function renderAduan(userType) {
    var html = '';
    
    if (userType === 'user') {
        html += '<div class="card"><h2>📝 Buat Aduan Baru</h2><form id="formAduan"><div class="form-row"><div class="form-group"><label>Tarikh</label><input type="date" id="tarikh" required></div><div class="form-group"><label>Masa</label><input type="time" id="masa" required></div></div><div class="form-group"><label>Nama</label><input type="text" id="nama" placeholder="Nama penuh" required></div><div class="form-group"><label>Jenis Aduan</label><input type="text" id="jenis" placeholder="Contoh: Kerosakan, Kebersihan, Keselamatan" required></div><div class="form-group"><label>Lokasi</label><input type="text" id="lokasi" placeholder="Contoh: Blok B, Tingkat 2" required></div><div class="form-group"><label>Gambar Bukti</label><div class="image-upload-area" id="uploadArea"><i class="fas fa-cloud-upload-alt"></i><p>Klik untuk upload gambar</p><small>JPG, PNG, GIF (Max 5MB)</small><input type="file" id="gambar" accept="image/*" required></div><div class="preview-container"><img id="preview" class="image-preview" alt="Preview"><button type="button" class="remove-image" id="removeImage"><i class="fas fa-times"></i></button></div></div><div class="form-group"><label>Catatan</label><textarea id="catatan" rows="4" placeholder="Terangkan secara ringkas..."></textarea></div><button type="submit" class="btn-primary" id="hantarAduanBtn"><i class="fas fa-paper-plane"></i> Hantar Aduan</button></form></div>';
    }
    
    html += '<div class="card"><h2>📋 Senarai Aduan</h2><div class="aduan-list" id="senaraiAduan"></div></div>';
    content.innerHTML = html;
    
    if (userType === 'user') {
        var gambarInput = document.getElementById('gambar');
        var preview = document.getElementById('preview');
        var removeBtn = document.getElementById('removeImage');
        
        if (gambarInput) {
            gambarInput.onchange = function(e) {
                var file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                    alert('Gambar terlalu besar! Maksimum 5MB');
                    this.value = '';
                    return;
                }
                var reader = new FileReader();
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.className = preview.className + ' show';
                    removeBtn.className = removeBtn.className + ' show';
                };
                reader.readAsDataURL(file);
            };
        }
        if (removeBtn) {
            removeBtn.onclick = function() {
                gambarInput.value = '';
                preview.src = '';
                preview.className = preview.className.replace(' show', '');
                removeBtn.className = removeBtn.className.replace(' show', '');
            };
        }
        document.getElementById('hantarAduanBtn').onclick = handleHantarAduan;
    }
    
    refreshSenarai(userType);
}

function refreshSenarai(userType) {
    var div = document.getElementById('senaraiAduan');
    if (!div) return;
    
    div.innerHTML = '<div style="text-align:center;color:#1e3a8a;padding:40px;"><i class="fas fa-spinner fa-pulse"></i> Memuatkan aduan...</div>';
    
    var currentUserEmail = localStorage.getItem('userEmail');
    var currentUserType = localStorage.getItem('userType');
    
    var promise;
    if (currentUserType === 'admin') {
        promise = loadAduan();
    } else {
        promise = loadAduanByUser(currentUserEmail);
    }
    
    promise.then(function(data) {
        aduanList = data;
        
        if (aduanList.length === 0) {
            div.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Tiada aduan buat masa ini</p>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < aduanList.length; i++) {
            var a = aduanList[i];
            html += '<div class="aduan-item"><div class="aduan-header"><span class="aduan-nama">' + a.nama + '</span><span class="aduan-tarikh">' + a.tarikh + ' ' + a.masa + '</span>' + (currentUserType === 'admin' ? '<button class="delete-btn" onclick="deleteAduan(\'' + a.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div><div class="aduan-detail"><span>Jenis:</span><span>' + a.jenis + '</span><span>Lokasi:</span><span>' + a.lokasi + '</span><span>Catatan:</span><span>' + a.catatan + '</span></div>' + (a.gambar ? '<img src="' + a.gambar + '" loading="lazy" class="aduan-gambar">' : '') + '</div>';
        }
        div.innerHTML = html;
    }).catch(function(error) {
        div.innerHTML = '<p style="text-align:center;color:#ef4444;padding:40px;">❌ Gagal memuatkan aduan. Sila refresh.</p>';
    });
}

// ========== HANDLE HANTAR ADUAN ==========
function handleHantarAduan() {
    var btn = document.getElementById('hantarAduanBtn');
    var originalText = btn.innerHTML;
    
    var gambarFile = document.getElementById('gambar').files[0];
    if (!gambarFile) {
        showNotification('Sila upload gambar bukti', false);
        return;
    }
    
    if (gambarFile.size > 5 * 1024 * 1024) {
        showNotification('Gambar terlalu besar! Maksimum 5MB', false);
        return;
    }
    
    btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Menghantar...';
    btn.disabled = true;
    
    var currentUserEmail = localStorage.getItem('userEmail');
    
    var reader = new FileReader();
    reader.onload = function(event) {
        var newAduan = {
            tarikh: document.getElementById('tarikh').value,
            masa: document.getElementById('masa').value,
            nama: document.getElementById('nama').value,
            jenis: document.getElementById('jenis').value,
            lokasi: document.getElementById('lokasi').value,
            gambar: event.target.result,
            catatan: document.getElementById('catatan').value,
            userEmail: currentUserEmail,
            selesai: false
        };
        
        saveAduanToFirebase(newAduan).then(function() {
            showNotification('Aduan berjaya dihantar!', true);
            setTimeout(function() {
                location.reload();
            }, 1500);
        }).catch(function(error) {
            console.error(error);
            showNotification('Gagal hantar aduan', false);
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    };
    reader.readAsDataURL(gambarFile);
}

// ========== STATUS PAGE ==========
function renderStatus() {
    var userType = localStorage.getItem('userType');
    content.innerHTML = '<div class="card"><h2>✅ Status Penyelesaian Aduan</h2><div class="status-container" id="statusContainer"></div></div>';
    refreshStatus(userType);
}

function refreshStatus(userType) {
    var container = document.getElementById('statusContainer');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center;color:#1e3a8a;padding:40px;"><i class="fas fa-spinner fa-pulse"></i> Memuatkan status...</div>';
    
    var currentUserEmail = localStorage.getItem('userEmail');
    var currentUserType = localStorage.getItem('userType');
    
    var promise;
    if (currentUserType === 'admin') {
        promise = loadAduan();
    } else {
        promise = loadAduanByUser(currentUserEmail);
    }
    
    promise.then(function(data) {
        aduanList = data;
        
        if (aduanList.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Tiada aduan buat masa ini</p>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < aduanList.length; i++) {
            var a = aduanList[i];
            html += '<div class="status-item" data-id="' + a.id + '"><input type="checkbox" class="status-checkbox" ' + (a.selesai ? 'checked' : '') + '><div class="status-info"><div style="display:flex;justify-content:space-between;align-items:start"><div><h4>' + a.jenis + ' - ' + a.lokasi + '</h4><p><i class="fas fa-user"></i> ' + a.nama + '</p><p><i class="fas fa-calendar"></i> ' + a.tarikh + ' ' + a.masa + '</p><p><i class="fas fa-comment"></i> ' + a.catatan + '</p><span class="status-badge ' + (a.selesai ? 'selesai' : 'belum') + '">' + (a.selesai ? '✓ Selesai' : '⏳ Belum Selesai') + '</span></div>' + (currentUserType === 'admin' ? '<button class="delete-btn" onclick="deleteAduan(\'' + a.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div></div></div>';
        }
        container.innerHTML = html;
        
        var checkboxes = document.querySelectorAll('.status-checkbox');
        for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].onchange = function() {
                var id = this.parentElement.getAttribute('data-id');
                var aduan = null;
                for (var j = 0; j < aduanList.length; j++) {
                    if (aduanList[j].id == id) {
                        aduan = aduanList[j];
                        break;
                    }
                }
                if (aduan) {
                    updateAduanStatus(id, this.checked).then(function() {
                        refreshStatus(userType);
                    });
                }
            };
        }
    }).catch(function(error) {
        container.innerHTML = '<p style="text-align:center;color:#ef4444;padding:40px;">❌ Gagal memuatkan status. Sila refresh.</p>';
    });
}

// ========== DIREKTORI PAGE ==========
function renderDirektori() {
    var html = '<div class="card"><h2>📞 Direktori Staf Unit Keselamatan</h2><div class="direktori-grid">';
    for (var i = 0; i < staffDirektori.length; i++) {
        var s = staffDirektori[i];
        html += '<div class="staf-card"><img src="' + s.gambar + '"><h3>' + s.nama + '</h3><p>' + s.jawatan + '</p><p class="phone"><i class="fas fa-phone-alt"></i> ' + s.telefon + '</p></div>';
    }
    html += '</div></div>';
    content.innerHTML = html;
}

// ========== DELETE ADUAN ==========
function deleteAduan(id) {
    if (confirm('Padam aduan ini?')) {
        deleteAduanFromFirebase(id).then(function() {
            var currentPage = document.querySelector('.sidebar-item.active').getAttribute('data-page');
            renderPage(currentPage);
        });
    }
}

// Load initial data
loadAduan().then(function(data) {
    aduanList = data;
    var currentPageElem = document.querySelector('.sidebar-item.active');
    var currentPage = currentPageElem ? currentPageElem.getAttribute('data-page') : null;
    if (currentPage) renderPage(currentPage);
});

checkLogin();