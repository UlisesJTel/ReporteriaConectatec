document.addEventListener("DOMContentLoaded", function() {
    loadTables();
});

let selectedTable = '';
let selectedColumns = [];
let filters = {};

// Cargar tablas
async function loadTables() {
    const response = await fetch('/get_tables');
    const tables = await response.json();
    const tablesList = document.getElementById("tables-list");
    tables.forEach(table => {
        const tableOption = document.createElement("input");
        tableOption.type = "radio";
        tableOption.name = "table";
        tableOption.value = table;
        tableOption.classList.add("form-check-input");
        tableOption.addEventListener("change", () => {
            selectedTable = table;
            loadColumns(table);
        });
        tablesList.appendChild(tableOption);

        const label = document.createElement("label");
        label.classList.add("form-check-label");
        label.innerText = table;
        tablesList.appendChild(label);
        tablesList.appendChild(document.createElement("br"));
    });
}

// Cargar columnas para la tabla seleccionada
async function loadColumns(tableName) {
    const response = await fetch('/get_columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_name: tableName })
    });
    const columns = await response.json();
    const columnsList = document.getElementById("columns-list");
    columnsList.innerHTML = ''; // Limpiar columnas anteriores

    columns.forEach(column => {
        const columnOption = document.createElement("input");
        columnOption.type = "checkbox";
        columnOption.value = column.name;
        columnOption.classList.add("form-check-input");
        columnOption.addEventListener("change", () => handleColumnSelection(column));
        columnsList.appendChild(columnOption);

        const label = document.createElement("label");
        label.classList.add("form-check-label");
        label.innerText = `${column.name} (${column.type})`;
        columnsList.appendChild(label);
        columnsList.appendChild(document.createElement("br"));
    });
}

// Manejar selección de columnas y mostrar filtros
function handleColumnSelection(column) {
    if (selectedColumns.includes(column.name)) {
        selectedColumns = selectedColumns.filter(col => col !== column.name);
        delete filters[column.name];
    } else {
        selectedColumns.push(column.name);
        if (column.name.startsWith("FK_")) {
            loadCatalog(column.name);
        } else {
            createFilters(column.name, column.type);
        }
    }

    // Mostrar botón si hay columnas seleccionadas
    document.getElementById("step3").style.display = selectedColumns.length > 0 ? "block" : "none";
}

// Cargar catálogo y abrir modal para seleccionar opciones
async function loadCatalog(catalogName) {
    const response = await fetch(`/get_catalog/${catalogName}`);
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

// Crear un filtro de texto
function createFilters(column, type) {
    const filtersList = document.getElementById("filters-list");
    const filterDiv = document.createElement("div");
    filterDiv.className= "form-group mb-3";

    if (type === 'date' || type === 'datetime' || type === 'datetime2') {
        filterDiv.innerHTML = `
            <label>Rango de fechas para: ${column}</label>
            <div class="row">
                <div class="col">
                    <input type="date" class="form-control" id="${column}-start" placeholder="Fecha inicial">
                </div>
                <div class="col">
                    <input type="date" class="form-control" id="${column}-end" placeholder="Fecha final">
                </div>
            </div>
        `;

        // Agregar event listeners para obtener las fechas y almacenarlas en filters
        const startDateInput = filterDiv.querySelector(`#${column}-start`);
        const endDateInput = filterDiv.querySelector(`#${column}-end`);

        startDateInput.addEventListener("input", (e) => {
            // Almacenar el valor de la fecha inicial
            filters[`${column}`] = [e.target.value, filters[`${column}`]?.[1] || null]; // Mantener la fecha final
        });

        endDateInput.addEventListener("input", (e) => {
            // Almacenar el valor de la fecha final
            filters[`${column}`] = [filters[`${column}`]?.[0] || null, e.target.value]; // Mantener la fecha inicial
        });
    } else {
        const label = document.createElement("label");
        label.innerText = `Filtro para ${column}`;
        filterDiv.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.classList.add("form-control");

        input.addEventListener("input", (e) => {
            filters[column] = e.target.value;
        });
        filterDiv.appendChild(input);
    }

    filtersList.appendChild(filterDiv);
}


let currentPage = 1;
const rowsPerPage = 10;
const maxPagesToShow = 5;
let currentSegment = 0;

async function generateReport() {
    console.log(filters)
    const response = await fetch('/generate_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: selectedTable,
            columns: selectedColumns,
            filters: filters
        })
    });

    const data = await response.json();
    const resultsDiv = document.getElementById("results");

    // Limpiar resultados previos
    resultsDiv.innerHTML = '';

    // Verificar si hay errores en la respuesta
    if (data.error) {
        resultsDiv.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        return;
    }

    function renderTable(page) {
        resultsDiv.innerHTML = ''; // Limpiar el contenido previo
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageData = data.slice(start, end);

        const table = document.createElement("table");
        table.className = "table table-bordered table-hover table-striped table-responsive";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const columnNames = Object.keys(data[0]);
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
        const totalPages = Math.ceil(data.length / rowsPerPage);
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
