// script.js

document.addEventListener('DOMContentLoaded', function() {
    const orderForm = document.getElementById('orderForm');
    const sendEmailBtn = document.getElementById('sendEmailBtn');
    const downloadCsvBtn = document.getElementById('downloadCsvBtn');
    const ordersTableBody = document.querySelector('#ordersTable tbody');
    const messageArea = document.getElementById('messageArea');

    // Carica gli ordini esistenti dal LocalStorage all'avvio e aggiorna la tabella
    let allOrders = JSON.parse(localStorage.getItem('paniniOrders')) || [];
    updateOrdersTable();

    // 1. GESTIONE INVIO DEL SINGOLO ORDINE
    orderForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Impedisce il ricaricamento della pagina

        // Raccogli i dati dal modulo
        const surname = document.getElementById('surname').value.trim();
        const sandwich = document.getElementById('sandwich').value;
        const drink = document.getElementById('drink').value;
        const timestamp = new Date().toLocaleString('it-IT');

        // Crea l'oggetto ordine
        const newOrder = {
            surname: surname,
            sandwich: sandwich,
            drink: drink,
            timestamp: timestamp
        };

        // Aggiungi l'ordine all'array e salva nel LocalStorage
        allOrders.push(newOrder);
        localStorage.setItem('paniniOrders', JSON.stringify(allOrders));

        // Aggiorna la tabella di anteprima
        updateOrdersTable();

        // Aggiungi la riga al CSV (nel browser dell'utente)
        addOrderToCsv(newOrder);

        // Mostra messaggio di conferma
        showMessage(`Ordine per <strong>${surname}</strong> aggiunto con successo!`, 'success');

        // Resetta il modulo, ma mantiene le selezioni di panino e bevanda se vuoi
        orderForm.reset();
    });

    // 2. FUNZIONE PER AGGIORNARE LA TABELLA DI ANTEPRIMA
    function updateOrdersTable() {
        ordersTableBody.innerHTML = ''; // Svuota la tabella

        if (allOrders.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" style="text-align: center; color: #636e72;">Nessun ordine ancora. Inseriscine uno!</td>`;
            ordersTableBody.appendChild(row);
            return;
        }

        // Mostra gli ultimi 5 ordini (più recenti prima)
        const recentOrders = [...allOrders].reverse().slice(0, 5);
        recentOrders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.surname}</td>
                <td>${order.sandwich}</td>
                <td>${order.drink}</td>
                <td>${order.timestamp}</td>
            `;
            ordersTableBody.appendChild(row);
        });
    }

    // 3. FUNZIONE PER AGGIUNGERE UNA RIGA AL FILE CSV (Download)
    function addOrderToCsv(order) {
        // Intestazioni del CSV
        const csvHeaders = ['Cognome', 'Panino', 'Bevanda', 'Data/Ora'];
        // Crea la riga CSV per questo ordine
        const csvRow = `"${order.surname}","${order.sandwich}","${order.drink}","${order.timestamp}"`;

        // Controlla se esiste già un file CSV salvato
        let csvContent = '';
        const storedCsv = localStorage.getItem('paniniCsvFile');

        if (storedCsv) {
            // Se il file esiste, aggiungi la nuova riga
            csvContent = storedCsv + '\n' + csvRow;
        } else {
            // Se è il primo ordine, crea il file con le intestazioni
            csvContent = csvHeaders.join(',') + '\n' + csvRow;
        }

        // Salva l'intero contenuto CSV nel LocalStorage
        localStorage.setItem('paniniCsvFile', csvContent);
    }

    // 4. FUNZIONE PER SCARICARE IL CSV COMPLETO
    downloadCsvBtn.addEventListener('click', function() {
        let csvContent = localStorage.getItem('paniniCsvFile');

        if (!csvContent) {
            showMessage('Non ci sono ancora ordini da scaricare.', 'error');
            return;
        }

        // Crea un blob (file virtuale) e un link per il download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `ordini_panini_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showMessage('File CSV scaricato con successo!', 'success');
    });

    // 5. INVIO ORDINI VIA EMAIL CON EMAILJS
    // PRIMA DI TUTTO: registrati su https://www.emailjs.com e configura un servizio email e un template.
    // Sostituisci questi valori con i tuoi (li trovi sul dashboard di EmailJS)
    const EMAILJS_USER_ID = 'YOUR_PUBLIC_USER_ID'; // Sostituisci
    const EMAILJS_SERVICE_ID = 'YOUR_EMAIL_SERVICE_ID'; // Sostituisci (es: service_gmail)
    const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Sostituisci (es: template_panini_orders)
    const DESTINATION_EMAIL = 'xxx@xx.com'; // Sostituisci con l'email del destinatario

    // Inizializza EmailJS con il tuo User ID
    (function() {
        emailjs.init(EMAILJS_USER_ID);
    })();

    sendEmailBtn.addEventListener('click', function() {
        if (allOrders.length === 0) {
            showMessage('Non ci sono ordini da inviare.', 'error');
            return;
        }

        // Prepara il contenuto dell'email formattando gli ordini
        let emailBody = '<h2>Riepilogo Ordini Panini</h2><ul>';
        allOrders.forEach(order => {
            emailBody += `<li><strong>${order.surname}</strong>: ${order.sandwich} con ${order.drink} (ordinato il: ${order.timestamp})</li>`;
        });
        emailBody += '</ul>';
        emailBody += `<p>Totale ordini: <strong>${allOrders.length}</strong></p>`;

        // Parametri per il template EmailJS
        const templateParams = {
            to_email: DESTINATION_EMAIL,
            subject: `Nuovi Ordini Panini - ${new Date().toLocaleDateString('it-IT')}`,
            message: emailBody,
            order_count: allOrders.length
        };

        // Invia l'email utilizzando EmailJS
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then(function(response) {
                showMessage(`Tutti gli ordini (${allOrders.length}) sono stati inviati con successo a ${DESTINATION_EMAIL}!`, 'success');
                // Opzionale: resetta gli ordini dopo l'invio
                // allOrders = [];
                // localStorage.removeItem('paniniOrders');
                // localStorage.removeItem('paniniCsvFile');
                // updateOrdersTable();
            }, function(error) {
                showMessage('Errore nell\'invio dell\'email: ' + JSON.stringify(error), 'error');
            });
    });

    // Funzione di utilità per mostrare messaggi
    function showMessage(text, type) {
        messageArea.innerHTML = text;
        messageArea.className = type; // 'success' o 'error'
        messageArea.style.display = 'block';

        // Nascondi il messaggio dopo 5 secondi
        setTimeout(() => {
            messageArea.style.display = 'none';
        }, 5000);
    }
});