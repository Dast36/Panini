// SISTEMA ORDINI - PaniNostro

document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const surnameInput = document.getElementById('surname');
    const sandwichSelect = document.getElementById('sandwich');
    const drinkSelect = document.getElementById('drink');
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const ordersTableBody = document.querySelector('#ordersTable tbody');
    const messageArea = document.getElementById('messageArea');
    const lastResetDateSpan = document.getElementById('lastResetDate');
    const totalOrdersSpan = document.getElementById('totalOrders');
    const uniquePaniniSpan = document.getElementById('uniquePanini');
    const todayOrdersSpan = document.getElementById('todayOrders');
    const currentYearSpan = document.getElementById('currentYear');

    const darkModeToggle = document.getElementById('darkModeToggle');
    const adminModal = document.getElementById('adminModal');
    const closeModal = document.querySelector('.modal .close');
    const openAdminBtn = document.getElementById('openAdminBtn');
    const adminOrdersList = document.getElementById('adminOrdersList');

    let allOrders = [];

    // Inizializza anno
    currentYearSpan.textContent = new Date().getFullYear();

    // DARK MODE
    if(localStorage.getItem('darkMode')==='true') document.body.classList.add('dark-mode');
    darkModeToggle.addEventListener('click', ()=>{
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // CARICA ORDINI
    function loadOrders() {
        const saved = localStorage.getItem('paniniOrders');
        if(saved) allOrders = JSON.parse(saved);
        updateAllDisplays();
    }

    function saveOrders(){
        localStorage.setItem('paniniOrders', JSON.stringify(allOrders));
        updateAllDisplays();
    }

    // MOSTRA MESSAGGI
    function showMessage(msg,type='success'){
        messageArea.innerHTML = msg;
        messageArea.className = type;
        messageArea.style.display='block';
        setTimeout(()=>{messageArea.style.display='none';},3000);
    }

    // AGGIUNGI ORDINE
    orderForm.addEventListener('submit', e=>{
        e.preventDefault();
        const surname = surnameInput.value.trim();
        const sandwich = sandwichSelect.value;
        const drink = drinkSelect.value;
        if(!surname || !sandwich || !drink){ showMessage('Compila tutti i campi!','error'); return; }
        const newOrder = {id:Date.now(), surname, sandwich, drink, timestamp:new Date().toLocaleString('it-IT')};
        allOrders.push(newOrder);
        saveOrders();
        orderForm.reset();
        surnameInput.focus();
        showMessage(`Ordine per ${surname} aggiunto!`);
    });

    // VISUALIZZA ORDINI
    function updateAllDisplays(){
        // Tabella
        ordersTableBody.innerHTML='';
        allOrders.forEach(o=>{
            const row = document.createElement('tr');
            row.innerHTML=`<td>${o.surname}</td><td>${o.sandwich}</td><td>${o.drink}</td><td>${o.timestamp}</td>`;
            ordersTableBody.appendChild(row);
        });
        // Statistiche
        totalOrdersSpan.textContent = allOrders.length;
        uniquePaniniSpan.textContent = [...new Set(allOrders.map(o=>o.sandwich))].length;
        todayOrdersSpan.textContent = allOrders.filter(o=>new Date(o.timestamp).toDateString()===new Date().toDateString()).length;
    }

    loadOrders();

    // CLEAR ALL
    clearAllBtn.addEventListener('click', ()=>{
        if(confirm('Sei sicuro di cancellare tutti gli ordini?')){
            allOrders=[];
            saveOrders();
            showMessage('Tutti gli ordini cancellati','success');
        }
    });

    // GENERA PDF
    generatePdfBtn.addEventListener('click', ()=>{
        if(allOrders.length===0){ showMessage('Nessun ordine','error'); return; }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text('Ordini PaniNostro',14,15);
        doc.autoTable({head:[['Cognome','Panino','Bevanda','Data/Ora']], body:allOrders.map(o=>[o.surname,o.sandwich,o.drink,o.timestamp])});
        doc.save(`ordini_${Date.now()}.pdf`);
        showMessage('PDF generato!');
    });

    // CSV
    downloadCsvBtn.addEventListener('click', ()=>{
        if(allOrders.length===0){ showMessage('Nessun ordine','error'); return; }
        let csv = 'Cognome,Panino,Bevanda,Data/Ora\n';
        allOrders.forEach(o=>{
            csv+=`"${o.surname}","${o.sandwich}","${o.drink}","${o.timestamp}"\n`;
        });
        const blob = new Blob([csv], {type:'text/csv'});
        const link = document.createElement('a');
        link.href=URL.createObjectURL(blob);
        link.download=`ordini_${Date.now()}.csv`;
        link.click();
        showMessage('CSV scaricato!');
    });

    // MODAL ADMIN
    function renderAdminOrders(){
        adminOrdersList.innerHTML='';
        allOrders.slice().reverse().forEach(o=>{
            const div = document.createElement('div');
            div.className='admin-order';
            div.innerHTML=`
                <span>${o.surname} - <input value="${o.sandwich}" data-id="${o.id}" class="edit-sandwich"> - <input value="${o.drink}" data-id="${o.id}" class="edit-drink"></span>
                <button data-id="${o.id}">Elimina</button>
            `;
            adminOrdersList.appendChild(div);
        });

        adminOrdersList.querySelectorAll('button').forEach(btn=>{
            btn.addEventListener('click', e=>{
                const id = Number(e.target.dataset.id);
                allOrders = allOrders.filter(o=>o.id!==id);
                saveOrders();
                renderAdminOrders();
                showMessage('Ordine eliminato','success');
            });
        });

        adminOrdersList.querySelectorAll('.edit-sandwich').forEach(input=>{
            input.addEventListener('change', e=>{
                const id = Number(e.target.dataset.id);
                const order = allOrders.find(o=>o.id===id);
                if(order) { order.sandwich = e.target.value; saveOrders(); showMessage('Panino modificato','success'); }
            });
        });
        adminOrdersList.querySelectorAll('.edit-drink').forEach(input=>{
            input.addEventListener('change', e=>{
                const id = Number(e.target.dataset.id);
                const order = allOrders.find(o=>o.id===id);
                if(order) { order.drink = e.target.value; saveOrders(); showMessage('Bevanda modificata','success'); }
            });
        });
    }

    openAdminBtn.addEventListener('click', ()=>{
        renderAdminOrders();
        adminModal.style.display='block';
    });
    closeModal.addEventListener('click', ()=> adminModal.style.display='none');
    window.addEventListener('click', e=>{if(e.target===adminModal) adminModal.style.display='none';});
});
