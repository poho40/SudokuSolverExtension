async function sendImageToFlask(imageData, height, width) {
    const url = "http://127.0.0.1:8000/process-image"; // Flask endpoint

    try {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ image: imageData, height: height, width: width }) 
        });

        let result = await response.json();
        const answerData = JSON.parse(result.answer); 
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {action: "sudoku", answerData: answerData});  
        });
        
        console.log("Server Response:", result);
    } catch (error) {
        console.error("Error sending image:", error);
    }
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendCanvasData") {
        sendImageToFlask(message.imageData, message.height, message.width);
        sendResponse({ status: "Image sent to server" });
    }
    else if (message.action === "manualData") {
        
    }
});
