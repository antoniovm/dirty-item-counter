document.getElementById('addRowBtn').addEventListener('click', () => addRowOrColumn(true));
document.getElementById('addColumnBtn').addEventListener('click', () => addRowOrColumn(false));
document.getElementById('exportBtn').addEventListener('click', exportToCSV);
document.getElementById('resetTableBtn').addEventListener('click', resetTable);


document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('tableData'));
    if (data) {
        loadTable(data);
    } else {
        // Add initial row
        resetTable();
    }
});

const headers = ['Nombre', '€/ud', 'Total(€)', 'Uds', 'Acciones', 'Eliminar'];
    

function addRowOrColumn(isRow) {
    const table = document.getElementById('dataTable');
    if (isRow) {
        const rowCount = table.rows.length - 1; // Adjust for total row
        const row = table.insertRow(rowCount);
        for (let i = 0; i < headers.length - 3; i++) {
            let cell = row.insertCell();
            cell.setAttribute('contenteditable' , 'true')
            cell.addEventListener('input', (e) => updateRowTotal(e.target));
        }
        addQuantityAndButtons(row, rowCount);
        addDeleteRowButton(row);
    } else {
        Array.from(table.rows).forEach((row, index) => {
            let cell = row.insertCell(1);
            cell.innerHTML = index === 0 ? '<b>Nueva Columna</b> <button onclick="deleteColumn(this)">X</button>' : 'Nombre';
        });
    }
    storeTableData();
}

function addQuantityAndButtons(row, rowCount, initialValue = 0) {
    let quantityCell = row.insertCell();
    quantityCell.innerHTML = initialValue;
    quantityCell.contentEditable = true;
    quantityCell.addEventListener('input', (e) => updateRowTotal(e.target));
    quantityCell.addEventListener('keypress', enforceNumericInput);

    let buttonCell = row.insertCell();
    buttonCell.innerHTML = '<button onclick="changeValue(this, 1)">+1</button>' +
                           '<button onclick="changeValue(this, -1)">-1</button>';
}

function addDeleteRowButton(row) {
    let deleteCell = row.insertCell();
    deleteCell.innerHTML = '<button onclick="deleteRow(this)">Eliminar Fila</button>';
}

function enforceNumericInput(event) {
    if (!/\d/.test(event.key) && event.key !== 'Backspace') {
        event.preventDefault();
    }
}

function handleCellInput(event) {
    // Handle input for all cells
    // For example, updating totals when quantity or unit price changes
    const row = event.target.parentNode;
    if (row.rowIndex < row.parentNode.rows.length - 1) { // Exclude the total row
        updateRowTotal(row);
        updateTotalPrice();
    }
    storeTableData();
}


function changeValue(btn, delta) {
    const row = btn.parentNode.parentNode;
    const valueCell = row.cells[row.cells.length - 3]; // Second to last cell
    let value = parseInt(valueCell.innerHTML);
    value += delta;
    valueCell.innerHTML = value;
    updateRowTotal(valueCell);
}

function updateRowTotal(target) {
    const row = target.parentNode;
    const unitPrice = parseFloat(row.cells[row.cells.length -5].innerText) || 0;
    const quantity = parseFloat(row.cells[row.cells.length -3].innerText) || 0;
    const totalPriceCell = row.cells[row.cells.length-4];
    totalPriceCell.innerText = (unitPrice * quantity).toFixed(2);
    updateTotalPrice();
}

function updateTotalPrice() {
    const table = document.getElementById('dataTable');
    let total = 0;
    for (let i = 0; i < table.rows.length - 1; i++) { // Exclude the total row
        let row = table.rows[i];
        let totalCell = row.cells[2];
        total += parseFloat(totalCell.innerText) || 0;
    }
    table.rows[table.rows.length - 1].cells[1].innerText = `${total.toFixed(2)}€`;
    storeTableData();
}

function deleteRow(btn) {
    const row = btn.parentNode.parentNode;
    row.parentNode.removeChild(row);
    updateTotalPrice();
    storeTableData();
}


function deleteColumn(btn) {
    const index = btn.parentNode.cellIndex;
    const table = document.getElementById('dataTable');
    Array.from(table.rows).forEach(row => row.deleteCell(index));
    storeTableData();
}

function resetTable() {
    const table = document.getElementById('dataTable');
    table.innerHTML = '<tr>' + headers.map(header => `<th>${header}</th>`).join('') + '</tr>';
    //addRowOrColumn(true); // Add initial row
    // Add total row
    addTotalRow(table);
    localStorage.removeItem('tableData');
}

function loadTable(data) {
    const table = document.getElementById('dataTable');
    table.innerHTML = '';
    const storedHeaders = data.shift();
    table.innerHTML = '<tr>' + storedHeaders.map(header => `<th>${header}</th>`).join('') + '</tr>';
    data.forEach((rowData, rowIndex) => {
        const row = table.insertRow();
        rowData.slice(0, -3).forEach(cellData => {
            const cell = row.insertCell();
            cell.setAttribute('contenteditable' , 'true')
            cell.addEventListener('input', (e) => updateRowTotal(e.target));
            cell.innerHTML = cellData;
        });
        addQuantityAndButtons(row, rowIndex + 1, rowData[rowData.length - 3]);
        addDeleteRowButton(row);
    });
    addTotalRow(table);
}

function storeTableData() {
    const table = document.getElementById('dataTable');
    let data = [];
    Array.from(table.rows).slice(0, -1).forEach(row => {
        let rowData = [];
        Array.from(row.cells).forEach(cell => {
            rowData.push(cell.innerHTML);
        });
        data.push(rowData);
    });
    localStorage.setItem('tableData', JSON.stringify(data));
}

function exportToCSV() {
    const table = document.getElementById('dataTable');
    let csvContent = 'data:text/csv;charset=utf-8,';
    Array.from(table.rows).forEach(row => {
        let rowData = Array.from(row.cells).slice(0, -2).map(cell => `"${cell.innerHTML}"`).join(',');
        csvContent += rowData + '\r\n';
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'tableData.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function addTotalRow(table) {
    const totalRow = table.insertRow();
    totalRow.innerHTML = '<td colspan="2">Total</td><td>0.00</td><td colspan="3"></td>';
    updateTotalPrice();
}

