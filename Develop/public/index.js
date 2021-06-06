let transactions = [];
let offlineDeposits   = []
let offlineWithdraws  = []
let myChart;

if ( navigator.onLine != true ) {

  let total     = localStorage.getItem("total")
  let amount    = localStorage.getItem("amount")
  let nameTrans = localStorage.getItem("nameTrans")

  document.getElementById("t-name").value = nameTrans
  document.getElementById("t-amount").value = amount
  document.getElementById("total").value = total

} else {

  let offlineDepositsLocal  = localStorage.getItem("offlineDeposits")
  let offlineWithdrawsLocal = localStorage.getItem("offlineWithdraws")

  if ( offlineDepositsLocal ) {

    offlineDepsosits = JSON.parse(offlineDeps)

    //Make API request to update the database...
    offlineDeposits.forEach( transaction => {
      sendTransaction(true, transaction)
    })

    localStorage.setItem("offlineDeposits", null)
  }

  if ( offlineWithdrawsLocal ) {
    offlineWithdraws = JSON.parse(offlineWithdrawsLocal)

    //Make API request to update the database...
    offlineWithdraws.forEach( transaction => {
      sendTransaction(false, transaction)
    })

    localStorage.setItem("offlineWithdraws", null)
  }


  //If the user just came online...

}



fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

gTotal = 0 
gNameTrans = ""
gAmount = 0

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  gTotal = total
  localStorage.setItem("total", total)

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
      data: {
        labels,
        datasets: [{
            label: "Total Over Time",
            fill: true,
            backgroundColor: "#6666ff",
            data
        }]
    }
  });
}

function sendTransaction(isAdding, transaction=null) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  if ( transaction ) {
    nameEl    = { value: transaction.name }
    amountEl  = { value: transaction.amount }
  }

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
   var transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();
  
  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
  .then(response => {    
    return response.json();
  })
  .then(data => {
    if (data.errors) {
      errorEl.textContent = "Missing Information";
    }
    else {
      // clear form
      nameEl.value = "";
      amountEl.value = "";
    }
  })
  .catch(err => {
    // fetch failed, so save in indexed db
    saveRecord(transaction);

    // clear form
    nameEl.value = "";
    amountEl.value = "";
  });
}

document.querySelector("#add-btn").onclick = function() {
  if ( navigator.onLine ) {

    sendTransaction(true);

  } else {

    let nameEl    = document.querySelector("#t-name");
    let amountEl  = document.querySelector("#t-amount");

    const transaction = { name: nameEl.value, amount: amountEl.value }

    offlineDeposits.push(transaction)
    localStorage.setItem("offlineDeposits", JSON.stringify(offlineDeposits))
  }
};

document.querySelector("#sub-btn").onclick = function() {
  if ( navigator.onLine ) {

    sendTransaction(false);

  } else {

    let nameEl    = document.querySelector("#t-name");
    let amountEl  = document.querySelector("#t-amount");

    const transaction = { name: nameEl.value, amount: amountEl.value }

    offlineWithdraws.push(transaction)
    localStorage.setItem("offlineWithdraws", JSON.stringify(offlineWithdraws))
  }
}