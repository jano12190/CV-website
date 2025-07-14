const counter = document.querySelector(".counter-number");
async function updateCounter() {
    let response = await fetch("https://t4qm3gti4j.execute-api.us-west-2.amazonaws.com/crc-lambda");
    let data = await response.json();
    counter.innerHTML = "Views: ${data}";
}

updateCounter();