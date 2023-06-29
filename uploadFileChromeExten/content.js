// Set the value of GlobalWorkerOptions.workerSrc property to the URL of the local pdf.worker.min.js file
if (typeof window !== "undefined" && "pdfjsLib" in window) {
  window["pdfjsLib"].GlobalWorkerOptions.workerSrc =
    chrome.runtime.getURL("pdf.worker.min.js");
}

// Load Mammoth.js library
const script = document.createElement("script");
script.src = chrome.runtime.getURL("mammoth.browser.min.js");
document.head.appendChild(script);

// Load xlsx.min.js library
const xlsxScript = document.createElement("script");
xlsxScript.src = chrome.runtime.getURL("xlsx.min.js");
document.head.appendChild(xlsxScript);

// Create the button
const button = document.createElement("button");
button.innerText = "Submit File";
button.style.backgroundColor = "black";
button.style.color = "white";
button.style.padding = "3px";
button.style.border = "none";
button.style.borderRadius = "3px";
button.style.margin = "3px";

// Create the progress bar container
const progressContainer = document.createElement("div");
progressContainer.style.width = "99%";
progressContainer.style.height = "5px";
progressContainer.style.backgroundColor = "grey";
progressContainer.style.margin = "3px";
progressContainer.style.borderRadius = "5px";

// Create the progress bar element
const progressBar = document.createElement("div");
progressBar.style.width = "0%";
progressBar.style.height = "100%";
progressBar.style.backgroundColor = "#32a9db";
progressContainer.appendChild(progressBar);

// Create the chunk size input
const chunkSizeInput = document.createElement("input");
chunkSizeInput.type = "number";
chunkSizeInput.min = "1";
chunkSizeInput.value = "15000";
chunkSizeInput.style.margin = "3px";
chunkSizeInput.style.width = "80px"; // Set the width of the input element
chunkSizeInput.style.height = "28px"; // Set the width of the input element
chunkSizeInput.style.color = "white"; // Set the font color inside the input element
chunkSizeInput.style.fontSize = "14px"; // Set the font size inside the input element
chunkSizeInput.style.backgroundColor = "#6e6e80";

// Create the chunk size label
const chunkSizeLabel = document.createElement("label");
chunkSizeLabel.innerText = "Chunk Size: ";
chunkSizeLabel.appendChild(chunkSizeInput);
chunkSizeLabel.style.color = "white"; // Set the font color of the label text

// Add a click event listener to the button
button.addEventListener("click", async () => {
  // Create the input element
  const input = document.createElement("input");
  input.type = "file";
  input.accept =
    ".txt,.js,.py,.html,.css,.json,.csv,.pdf,.doc,.docx,.xls,.xlsx"; // Add .xls and .xlsx to accepted file types

  // Add a change event listener to the input element
  input.addEventListener("change", async () => {
    // Reset progress bar once a new file is inserted
    progressBar.style.width = "0%";
    progressBar.style.backgroundColor = "#32a9db";

    // Read the file as text or extract text from PDF/Word/Excel file
    const file = input.files[0];
    let text;
    if (file.type === "application/pdf") {
      text = await extractTextFromPdfFile(file);
    } else if (
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      text = await extractTextFromWordFile(file);
    } else if (
      file.type === "application/vnd.ms-excel" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      text = await extractTextFromExcelFile(file);
    } else {
      text = await file.text();
    }
    // Get the chunk size from the input element
    const chunkSize = parseInt(chunkSizeInput.value);

    // Split the text into chunks of the specified size
    const numChunks = Math.ceil(text.length / chunkSize);
    for (let i = 0; i < numChunks; i++) {
      const chunk = text.slice(i * chunkSize, (i + 1) * chunkSize);

      // Submit the chunk to the conversation
      await submitConversation(chunk, i + 1, file.name);

      // Update the progress bar
      progressBar.style.width = `${((i + 1) / numChunks) * 100}%`;

      // Wait for ChatGPT to be ready
      let chatgptReady = false;
      while (!chatgptReady) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        chatgptReady = !document.querySelector(
          ".text-2xl > span:not(.invisible)"
        );
      }
    }

    // Finish updating the progress bar
    progressBar.style.backgroundColor = "#32a9db";

    // Enable the button after finishing the process
    button.disabled = false;
  });

  // Click the input element to trigger the file selection dialog
  input.click();
});

// Add a drop event listener to the button
button.addEventListener("drop", async (event) => {
  event.preventDefault();

  // Reset progress bar once a new file is dropped
  progressBar.style.width = "0%";
  progressBar.style.backgroundColor = "#32a9db";

  // Read the dropped file as text or extract text from PDF/Word/Excel file
  const file = event.dataTransfer.files[0];
  let text;
  if (file.type === "application/pdf") {
    text = await extractTextFromPdfFile(file);
  } else if (
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await extractTextFromWordFile(file);
  } else if (
    file.type === "application/vnd.ms-excel" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    text = await extractTextFromExcelFile(file);
  } else {
    text = await file.text();
  }
  // Get the chunk size from the input element
  const chunkSize = parseInt(chunkSizeInput.value);

  // Split the text into chunks of the specified size
  const numChunks = Math.ceil(text.length / chunkSize);
  for (let i = 0; i < numChunks; i++) {
    const chunk = text.slice(i * chunkSize, (i + 1) * chunkSize);

    // Submit the chunk to the conversation
    await submitConversation(chunk, i + 1, file.name);

    // Update the progress bar
    progressBar.style.width = `${((i + 1) / numChunks) * 100}%`;

    // Wait for ChatGPT to be ready
    let chatgptReady = false;
    while (!chatgptReady) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      chatgptReady = !document.querySelector(
        ".text-2xl > span:not(.invisible)"
      );
    }
  }

  // Finish updating the progress bar
  progressBar.style.backgroundColor = "#32a9db";

  // Enable the button after finishing the process
  button.disabled = false;

  // Highlight the button in grey color
  button.style.backgroundColor = "grey";
});

// Add a dragover event listener to the button
button.addEventListener("dragover", (event) => {
  event.preventDefault();
  // Highlight the button in grey color
  button.style.backgroundColor = "grey";
});




// Define a function that extracts text from a PDF file using pdf.js library and window['pdfjsLib'] object reference
async function extractTextFromPdfFile(file) {
  const pdfDataUrl = URL.createObjectURL(file);
  const pdfDoc = await window["pdfjsLib"].getDocument(pdfDataUrl).promise;
  let textContent = "";
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const pageTextContent = await page.getTextContent();
    textContent += pageTextContent.items.map((item) => item.str).join(" ");
  }
  return textContent;
}

// Define the extractTextFromWordFile function
async function extractTextFromWordFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target.result;
      const options = { includeDefaultStyleMap: true }; // Customize options as needed
      window.mammoth
        .extractRawText({ arrayBuffer }, options)
        .then((result) => {
          const text = result.value;
          resolve(text);
        })
        .catch((error) => {
          reject(error);
        });
    };
    reader.onerror = function (event) {
      reject(new Error("Error occurred while reading the Word file."));
    };
    reader.readAsArrayBuffer(file);
  });
}

// Define the extractTextFromExcelFile function
async function extractTextFromExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target.result;
      const options = {
        type: "array",
        cellFormula: false,
        cellHTML: false,
        cellStyles: false,
      }; // Customize options as needed
      const workbook = XLSX.read(arrayBuffer, options);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const text = jsonData.flat().join(" ");
      resolve(text);
    };
    reader.onerror = function (event) {
      reject(new Error("Error occurred while reading the Excel file."));
    };
    reader.readAsArrayBuffer(file);
  });
}

async function submitConversation(text, part, filename) {
  // Find the textarea element
  const textarea = document.querySelector("textarea[tabindex='0']");

  // Set the value of the textarea
  textarea.value = `Part ${part} of ${filename}: \n\n ${text}`;
  textarea.dispatchEvent(new Event("input", { bubbles: true }));

  // Find the container element
  const container = document.querySelector(
    ".flex.flex-col.w-full.flex-grow.md\\:py-4.md\\:pl-4"
  );

  // Find the button element within the container
  const submitButton = container.querySelector("button");

  // Check if the button is disabled
  if (submitButton.disabled) {
    // Enable the button
    submitButton.disabled = false;
  }

  // Click the button
  submitButton.click();

  await new Promise((resolve) => setTimeout(resolve, 1000));
}

// Periodically check if the button has been added to the page and add it if it hasn't
const targetSelector =
  ".px-3.pb-3.pt-2.text-center.md\\:px-4.md\\:pb-6.md\\:pt-3";
const intervalId = setInterval(() => {
  const targetElement = document.querySelector(targetSelector);
  if (targetElement && !targetElement.contains(button)) {
    // Create a wrapper div to hold the target element and the button
    const wrapperDiv = document.createElement("div");
    wrapperDiv.style.display = "flex";
    wrapperDiv.style.flexDirection = "column";

    // Insert the button before the target element
    wrapperDiv.appendChild(button);

    // Insert the progress bar container before the button
    wrapperDiv.appendChild(progressContainer);

    // Insert the chunk size label and input before the progress bar container
    wrapperDiv.appendChild(chunkSizeLabel);

    // Replace the target element with the wrapper div
    targetElement.parentNode.replaceChild(wrapperDiv, targetElement);

    // Move the target element into the wrapper div
    wrapperDiv.appendChild(targetElement);

    // Set the custom styles for the container
    wrapperDiv.style.width = "750px"; // Replace "400px" with your desired width value
    wrapperDiv.style.margin = "0 auto"; // Center the container horizontally
    //wrapperDiv.style.marginLeft = "455px"; // Move the container 50px to the right
    wrapperDiv.parentNode.style.justifyContent = "center";

    // Clear the interval as the button has been added
    clearInterval(intervalId);
  }
}, 1000);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "enableButton") {
    // Enable the button
    button.disabled = false;
  }
});
