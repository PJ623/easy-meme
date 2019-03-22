/*
    TODO:
    * UX
*/

function EasyMeme() {
    // Admittedly over-engineered... simplify later
    var Helper = {
        checkType: function checkType(data, type) {
            if (type && typeof type == "string") {
                if (typeof data == type)
                    return true;
            }
            return false;
        },
        getElement: function getElement(elementID) {
            var element = document.getElementById(elementID);

            if (!this.checkType(elementID, "string"))
                throw new Error("'" + elementID + "', is not a string.");
            else if (element == null)
                throw new Error("'" + elementID + "' cannot be found.");

            return element;
        },
        createElement: function createElement(typeOfElement) {
            if (!this.checkType(typeOfElement, "string"))
                throw new Error("'" + typeOfElement + "' is not a string.");

            return document.createElement(typeOfElement);
        },
        // Move to canvasManager or generalize further?
        TextWrapper: function TextWrapper(context, maxLineWidth) {

            function measureText(text) {
                return context.measureText(text).width;
            }

            // fits text into lines of text
            function wrapText(text, splitter) {
                var output = []; // stores lines of text
                var outputIndex = 0; // increments when new line is needed
                var textArray = text.split(splitter);
                var line = "";

                for (let i = 0; i < textArray.length; i++) {
                    line = line.concat(textArray[i]);

                    if (i < (textArray.length - 1) && measureText(line.concat(splitter)) <= maxLineWidth)
                        line = line.concat(splitter);

                    // If line fits, store line's value.
                    if (measureText(line) <= maxLineWidth) {
                        output[outputIndex] = line;

                        // If line is too long, create a new line and retry.
                    } else {
                        outputIndex++;
                        i--;
                        line = "";
                    }
                }

                return output;
            }

            // Uses wrapText(..) multiple times to wrap complex bodies of text
            return function (text) {

                // Tokenizes paragraphs into sentences
                var lines = text.split("\n");
                var wrappedLines = [];

                for (let i = 0; i < lines.length; i++) {

                    // Tokenizes sentences into words
                    var words = lines[i].split(" ");
                    wrappedLines[i] = [];

                    // Wraps words to fit onto canvas
                    for (let j = 0; j < words.length; j++) {
                        var wrappedChars = wrapText(words[j], "");
                        wrappedLines[i].push(wrappedChars.join(" "));
                    }
                    wrappedLines[i] = wrappedLines[i].join(" ");

                    // Wraps sentences to fit onto canvas
                    var wrappedWords = wrapText(wrappedLines[i], " ");

                    for (let j = 0; j < wrappedWords.length; j++) {
                        wrappedWords[j] = wrappedWords[j].trim();
                    }
                    wrappedLines[i] = wrappedWords;
                }

                function flattenArray(textArray, result) {
                    if (!result)
                        result = [];

                    for (let i = 0; i < textArray.length; i++) {
                        if (Array.isArray(textArray[i]))
                            flattenArray(textArray[i], result);
                        else
                            result.push(textArray[i]);
                    }
                    return result;
                }

                var flattenedArray = flattenArray(wrappedLines);

                return flattenedArray;
            }
        }
    };

    function CanvasManager() {
        var canvas;
        var context;

        // take in fontsize?
        var drawText = function drawText(text, x, y, settings) {
            context.font = settings.fontSize.toString().concat("px ") + settings.fontFamily;
            context.textBaseline = settings.textBaseline;
            context.fillText(text, x, y);
        }

        var save = function save() {
            context.save();
        }

        var restore = function restore() {
            context.restore();
        }

        var drawImage = function drawImage(image, x, y, dW, dH) {
            if (dW && dH) {
                context.drawImage(image, x, y, dW, dH);
            } else {
                context.drawImage(image, x, y);
            }
        }

        var setBackgroundColor = function setBackgroundColor(color) {
            context.fillStyle = color;
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.stroke();
        }

        var getContext = function getContext() {
            return context;
        }

        var setHeight = function setHeight(height) {
            if (!Helper.checkType(height, "number")) {
                console.error("'" + height + "' is not a number.");
                return;
            }
            canvas.height = height;
        }

        var getHeight = function getHeight() {
            return canvas.height;
        }

        var setWidth = function setWidth(width) {
            if (!Helper.checkType(width, "number")) {
                console.error("'" + width + "' is not a number.");
                return;
            }
            canvas.width = width;
        }

        var getWidth = function getWidth() {
            return canvas.width;
        }

        var exportCanvas = function exportCanvas(type, quality) {
            if (!type || !Helper.checkType(type, "string")) {
                type = "image/jpeg";
            }

            if (!quality || !Helper.checkType(quality, "number") || quality > 1 || quality < 0) {
                quality = 0.7;
            }
            //console.log("dataURL:", canvas.toDataURL("image/jpeg", 0.7));
            return canvas.toDataURL(type, quality);
        }

        function bindCanvas(canvasID) {
            canvas = Helper.getElement(canvasID);
            context = canvas.getContext("2d");
        }

        var initiate = function initiate(canvasID) {
            console.log("Initiating CanvasManager...");
            this.setHeight = setHeight;
            this.getHeight = getHeight;
            this.setWidth = setWidth;
            this.getWidth = getWidth;
            this.drawImage = drawImage;
            this.drawText = drawText;

            this.save = save;
            this.restore = restore;
            this.getContext = getContext;
            this.setBackgroundColor = setBackgroundColor;
            this.exportCanvas = exportCanvas;

            bindCanvas(canvasID);
            console.log("CanvasManager successfully initiated.");
        }

        return {
            initiate: initiate
        };
    }

    function assembleMeme(canvasManager) {
        return function (src, text, downloadLinkID, dimensionalLimit) {

            // A little hackey. Revise later.
            var preliminaryImage;

            preliminaryImage = Helper.createElement("img");
            document.body.appendChild(preliminaryImage);
            preliminaryImage.src = src;
            preliminaryImage.crossOrigin = "anonymous";
            preliminaryImage.style.objectFit = "contain";
            preliminaryImage.style.visibility = "hidden";
            preliminaryImage.style.display = "block";

            preliminaryImage.onload = function () {
                var image = Helper.createElement("img");
                document.body.appendChild(image);
                image.crossOrigin = "anonymous";
                image.style.objectFit = "contain";
                image.style.visibility = "hidden";
                image.style.display = "block";

                image.src = src;

                if (dimensionalLimit && (preliminaryImage.width > dimensionalLimit || preliminaryImage.height > dimensionalLimit)) {
                    if (preliminaryImage.width > preliminaryImage.height) {
                        image.width = dimensionalLimit;
                    }
                    else if (preliminaryImage.width <= preliminaryImage.height) {
                        image.height = dimensionalLimit;
                    }
                }

                preliminaryImage.style.display = "none";

                image.onload = function () {

                    if (dimensionalLimit && (image.width > dimensionalLimit || image.height > dimensionalLimit)) {
                        if (image.width > image.height)
                            image.width = dimensionalLimit;
                        else if (image.width < image.height)
                            image.height = dimensionalLimit;
                    }

                    var fontSize;

                    // make more robust
                    function calculateFontSize() {
                        if (!text)
                            return 0;
                        return (image.height / 18);
                    }

                    fontSize = calculateFontSize();
                    canvasManager.setWidth(image.width);
                    canvasManager.setHeight(image.height);

                    var context = canvasManager.getContext();
                    context.font = fontSize.toString().concat("px") + " Calibri";
                    context.textBaseline = "bottom";

                    var padding = fontSize / 2;

                    // Wrap text
                    var textWrapper = Helper.TextWrapper(context, canvasManager.getWidth() - (padding * 2));
                    var wrappedTextArray = textWrapper(text);
                    var textSpace = (padding * 2) + (wrappedTextArray.length * fontSize);

                    canvasManager.setHeight(image.height + textSpace); // reset height
                    context.save();
                    canvasManager.setBackgroundColor("#FFFFFF");
                    context.restore();
                    canvasManager.drawImage(image, 0, textSpace, image.width, image.height);

                    // Render
                    var yOffset = fontSize;
                    for (let i = 0; i < wrappedTextArray.length; i++) {
                        if (i == 0)
                            yOffset = fontSize + padding;

                        canvasManager.drawText(wrappedTextArray[i], padding, yOffset, { fontSize: fontSize, fontFamily: "Calibri", textBaseline: "bottom" });
                        yOffset = yOffset + fontSize;
                    }

                    // TODO: Assemble images of preset sizes

                    var finalImage = Helper.createElement("img");
                    finalImage.src = canvasManager.exportCanvas("image/jpeg", 0.5);
                    finalImage.crossOrigin = "anonymous";

                    finalImage.onload = function () {
                        canvasManager.drawImage(finalImage, 0, 0);

                        if (typeof downloadLinkID == "string" && Helper.getElement(downloadLinkID)) {
                            var downloadLink = Helper.getElement(downloadLinkID);
                            downloadLink.href = finalImage.src;
                            downloadLink.download = "meme.jpeg";
                        }

                        image.style.display = "none"; // move elsewhere? Image displays before disappearing
                        image.remove();
                    }
                }
            }
        }
    }

    // CURRY BOYS
    // Super duper messy. Please clean later
    var upload = function upload(canvasManager) {
        return function (src, text) {
            if (!Helper.checkType(src, "string"))
                console.warn("'" + src + "' is not a string.");

            fetch(src)
                .then(
                    function (response) {
                        if (response.status !== 200) {
                            console.warn("Unexpected response (Status Code:" + response.status + ").");
                            return;
                        }

                        var memeAssembler = assembleMeme(canvasManager);
                        memeAssembler(src, text, "download-link");
                        memeAssembler(src, text, "download-link-small", 700);
                        document.getElementById("results-container").style.display = "block";
                    }
                ).catch(
                    function (e) {
                        console.error(e);
                    }
                );
        }
    }

    var initiate = function initiate(canvasID) {
        console.log("Initiating Easy Meme...");
        try {
            var canvasManager = CanvasManager();
            canvasManager.initiate(canvasID);
            this.upload = upload(canvasManager); // CURRY!
        } catch (e) {
            console.error(e);
        }
        console.log("Easy Meme successfully initiated.");
    }

    return {
        initiate: initiate
    }
}

var easyMeme = EasyMeme();
easyMeme.initiate(/*"URL-text-box", "upload-button"*/ "result");

var textTextBox = document.getElementById("text-text-box");

var URLTextBox = document.getElementById("URL-text-box");
URLTextBox.value = "https://i.imgur.com/32tBLV9.jpg"; // temporary

var fileBox = document.getElementById("file-box");

var uploadButton = document.getElementById("upload-button");
uploadButton.addEventListener("click", function () {
    if (fileBox.files[0]) {
        let fileReader = new FileReader();
        fileReader.onload = function () {
            easyMeme.upload(this.result, textTextBox.value);
        };

        fileReader.readAsDataURL(fileBox.files[0]);
    } else {
        easyMeme.upload(URLTextBox.value, textTextBox.value);
    }
});