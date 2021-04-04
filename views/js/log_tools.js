function copyElement(element) {
  $(`#${element}`).select();
  document.execCommand('copy');
}

function downloadLogs() {
	let text = $("#log-area").val();
  let blob = new Blob([text], { type: "text/plain"});
  var anchor = document.createElement("a");
  anchor.download = `log.txt`;
  anchor.href = window.URL.createObjectURL(blob);
  anchor.target ="_blank";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
