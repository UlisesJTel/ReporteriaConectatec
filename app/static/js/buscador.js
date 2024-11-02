function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const filterTables = debounce(() => {
    const searchValue = document.getElementById("tableSearch").value.toLowerCase();
    const tables = document.querySelectorAll(".table-div-own");

    tables.forEach(table => {
        const label = table.querySelector("label").innerText.toLowerCase();
        table.style.display = label.includes(searchValue) ? "block" : "none";
    });
}, 300);


const filterColumns = debounce(()=>{
    const searchValue = document.getElementById("columnSearch").value.toLowerCase();
    const columns = document.querySelectorAll(".column-container");

    columns.forEach(column => {
        const label = column.querySelector("label").innerText.toLowerCase();
        column.style.display = label.includes(searchValue) ? "block" : "none";
    });

},300);


document.getElementById("tableSearch").oninput = filterTables;
document.getElementById("columnSearch").oninput = filterColumns;
