let selectedTable = '';
let selectedColumns = [];
let filters = {};

let currentPage = 1;
const rowsPerPage = 10;
const maxPagesToShow = 5;
let currentSegment = 0;

let reportData = [];


// Selecciona una nueva tabla
async function loadColumns(checkbox_selected,table_name) {
    
    selectedTable = table_name;
    selectedColumns = [];
    filters = {};
    reportData = [];

    document.getElementById("columns-list").innerHTML = '';
    document.getElementById("results-data").innerHTML = '';
    document.getElementById("filters-list").innerHTML = '';
    document.getElementById("generate-report").style.display = "none";

    const checkboxes = document.querySelectorAll("input[name='table']");
    checkboxes.forEach(checkbox =>{
            if(checkbox !== checkbox_selected){
                checkbox.checked = false;
            }
        }
    );

    if(checkbox_selected.checked){
        const response = await fetch('/get_columns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table_name: table_name })
        });
        const columns = await response.json();
        const columnsList = document.getElementById("columns-list");

        columns.forEach(column => {
       

            const columnContainer = document.createElement("div");
            columnContainer.className = "column-container";
        
            const columnOption = document.createElement("input");
            columnOption.type = "checkbox";
            columnOption.value = column.name;
            columnOption.classList.add("circle-checkbox");
            columnOption.addEventListener("change", () => handleColumnSelection(column));
            
            const label = document.createElement("label");
            label.classList.add("form-check-label", "column-label");
            label.innerText = `${column.name} (${column.type})`;
        
            columnContainer.appendChild(columnOption);
            columnContainer.appendChild(label);
            columnsList.appendChild(columnContainer);
           
        });
       
        
    }else{

        selectedTable = '';
    }
}


// Cargar catálogo y abrir modal para seleccionar opciones
async function loadCatalog(catalogName) {
    const response = await fetch(`/get_catalog/${catalogName}/${selectedTable}`);
    const catalog = await response.json();
    if (catalog.error) {
        alert(catalog.error);
        return;
    }

    const modalTitle = document.getElementById("catalog-modal-title");
    modalTitle.innerText = `Select ${catalogName}`;

    const modalBody = document.getElementById("catalog-modal-body");
    modalBody.innerHTML = ''; // Limpiar contenido del modal

    catalog.forEach(item => {
        const option = document.createElement("input");
        option.type = "checkbox";
        option.value = item.value;
        option.classList.add("form-check-input");
        option.addEventListener("change", () => updateCatalogFilter(catalogName, item.value, option.checked));
        modalBody.appendChild(option);

        const label = document.createElement("label");
        label.classList.add("form-check-label");
        label.innerText = item.label;
        modalBody.appendChild(label);
        modalBody.appendChild(document.createElement("br"));
    });

    const modal = new bootstrap.Modal(document.getElementById("catalog-modal"));
    modal.show();
}

// Actualizar filtros de catálogo
function updateCatalogFilter(catalogName, value, isChecked) {
    if (!filters[catalogName]) filters[catalogName] = [];
    if (isChecked) {
        filters[catalogName].push(value);
    } else {
        filters[catalogName] = filters[catalogName].filter(v => v !== value);
    }
}


// Crear un filtro de texto o rango de fecha con IDs únicos para cada elemento
function createFilters(column, type) {
    const filtersList = document.getElementById("filters-list");

    // Crear div del filtro con un ID único
    const filterDiv = document.createElement("div");
    filterDiv.className = "form-group filter-text";
    filterDiv.id = `filter-${column}`;

    if (type === 'date' || type === 'datetime' || type === 'datetime2') {
        filterDiv.innerHTML = `
            <label>Rango de fechas para: ${column}</label>
            <input type="date" class="form-control styled-input" id="${column}-start">
            <br>
            <input type="date" class="form-control styled-input" id="${column}-end">
        `;

        // Event listeners para almacenar valores en filters
        const startDateInput = filterDiv.querySelector(`#${column}-start`);
        const endDateInput = filterDiv.querySelector(`#${column}-end`);

        startDateInput.addEventListener("input", (e) => {
            filters[`${column}`] = [e.target.value, filters[`${column}`]?.[1] || null]; 
        });

        endDateInput.addEventListener("input", (e) => {
            filters[`${column}`] = [filters[`${column}`]?.[0] || null, e.target.value];
        });
    } else {
        const label = document.createElement("label");
        label.innerText = `Filtro para ${column}`;
        filterDiv.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("form-control", "styled-input");
        input.id = `filter-input-${column}`;  // ID único

        input.addEventListener("input", (e) => {
            filters[column] = e.target.value;
        });
        filterDiv.appendChild(input);
    }

    filtersList.appendChild(filterDiv);
}

// Actualizar el código de manejo de selección para eliminar filtros por ID al deseleccionar columna
function handleColumnSelection(column) {
    const generateReportButton = document.getElementById("generate-report");

    if (selectedColumns.includes(column.name)) {
        selectedColumns = selectedColumns.filter(col => col !== column.name);
        delete filters[column.name];

        // Eliminar el filtro de la pestaña de filtros por su ID
        const filterDiv = document.getElementById(`filter-${column.name}`);
        if (filterDiv) filterDiv.remove();

    } else {
        selectedColumns.push(column.name);
        if (selectedColumns.length > 0) {
            generateReportButton.style.display = "block";
        }
        
        if (column.name.startsWith("FK_") || column.name == 'FL_MOTIVO_RECHAZO') {
            loadCatalog(column.name);
        } else {
            createFilters(column.name, column.type);
        }
    }

    // Ocultar el botón si no hay columnas seleccionadas
    if (selectedColumns.length === 0) {
        generateReportButton.style.display = "none";
    }
}




async function generateReport() {
    const response = await fetch('/generate_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: selectedTable,
            columns: selectedColumns,
            filters: filters
        })
    });

    reportData = await response.json();
    const resultsDiv = document.getElementById("results-data");

    // Limpiar resultados previos
    resultsDiv.innerHTML = '';

    // Verificar si hay errores en la respuesta
    if (reportData.error) {
        resultsDiv.innerHTML = `<div class="alert alert-danger">${reportData.error}</div>`;
        return;
    }

    function renderTable(page) {
        resultsDiv.innerHTML = ''; // Limpiar el contenido previo
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = reportData.slice(start, end);

        const table = document.createElement("table");
        table.className = "table table-bordered table-hover table-striped table-responsive custom-table";
        
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const columnNames = Object.keys(reportData[0]);
        columnNames.forEach(column => {
            const th = document.createElement("th");
            th.innerText = column;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        pageData.forEach(row => {
            const tr = document.createElement("tr");
            columnNames.forEach(column => {
                const td = document.createElement("td");
                td.innerText = row[column];
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        resultsDiv.appendChild(table);

        renderPagination();
    }

    function renderPagination() {
        const totalPages = Math.ceil(reportData.length / rowsPerPage);
        const paginationDiv = document.createElement("nav");
        paginationDiv.className = "d-flex justify-content-center mt-3";
        
        const ul = document.createElement("ul");
        ul.className = "pagination";

        const totalSegments = Math.ceil(totalPages / maxPagesToShow);
        const startPage = currentSegment * maxPagesToShow + 1;
        const endPage = Math.min(startPage + maxPagesToShow - 1, totalPages);

        if (currentSegment > 0) {
            ul.appendChild(createPageItem("Inicio", () => {
                currentSegment = 0;
                currentPage = 1;
                renderTable(currentPage);
            }));
            ul.appendChild(createPageItem("Anterior", () => {
                currentSegment--;
                currentPage = currentSegment * maxPagesToShow + 1;
                renderTable(currentPage);
            }));
        }

        for (let i = startPage; i <= endPage; i++) {
            const li = document.createElement("li");
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            const button = document.createElement("button");
            button.className = "page-link";
            button.innerText = i;
            button.onclick = () => {
                currentPage = i;
                renderTable(currentPage);
            };
            li.appendChild(button);
            ul.appendChild(li);
        }

        if (currentSegment < totalSegments - 1) {
            ul.appendChild(createPageItem("Siguiente", () => {
                currentSegment++;
                currentPage = currentSegment * maxPagesToShow + 1;
                renderTable(currentPage);
            }));
            ul.appendChild(createPageItem("Final", () => {
                currentSegment = totalSegments - 1;
                currentPage = (totalSegments - 1) * maxPagesToShow + 1;
                renderTable(currentPage);
            }));
        }

        paginationDiv.appendChild(ul);
        resultsDiv.appendChild(paginationDiv);
    }

    function createPageItem(text, onClick) {
        const li = document.createElement("li");
        li.className = "page-item";
        const button = document.createElement("button");
        button.className = "page-link";
        button.innerText = text;
        button.onclick = onClick;
        li.appendChild(button);
        return li;
    }

    renderTable(currentPage);
}

function downloadExcel() {
    // Obtener el nombre del archivo desde el input
    var file_name = document.getElementById("file_name").value.trim();

    // Validar que el nombre no esté vacío o sea nulo
    if (!file_name) {
        file_name = "Reporte"; 
    }

    // Convertir los datos de JSON a un objeto SheetJS
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

   
    XLSX.writeFile(workbook, `${file_name}.xlsx`);
}
