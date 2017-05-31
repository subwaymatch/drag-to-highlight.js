function DragToHighlight(contentEls, options) {

	const ELEMENT_NODE_TYPE = 1;
	const TEXT_NODE_TYPE = 3;

	// User-configurable options
	var highlightableElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'];
	var highlightColor = '#fff178';
	var wrapElName = 'hl-wrap';							// A custom element to wrap each word in paragraphs to detect user click position
	var highlightElName = 'hl-highlight';					// Class of highlighted element
	var highlightableClassName = 'hl-highlightable';		// Custom class to allow highlighting

	// Stacks used to keep undo/redo history
	var undoHistoryStack = [];
	var redoHistoryStack = [];

	// Register custom elements
	var WrapElement = document.registerElement(wrapElName);
	var HighlightElement = document.registerElement(highlightElName);

	// TODO: Refactor code to make lib work with all types of children nodes
	// Paragraph elements
	var paragraphEls = [];


	/**
	 * Initialize the highlighter plug-in
	 */
	var init = function() {
		// If a single HTML element has been passed, convert it into an array
		if (contentEls instanceof Element) {
			contentEls = [contentEls];
		}

		contentEls.forEach(function(contentEl, i) {
			var contentChildNodes = contentEl.childNodes;

			contentChildNodes.forEach(function (el, index, childNodes) {
				if ((el.classList != undefined && el.classList.contains(highlightableClassName)) || (highlightableElements.indexOf(el.nodeName.toLowerCase()) > -1)) {
					paragraphEls.push(el);
					wrapAllWordsInElement(el);
				}
			});
		});

		attachEventHandlers();
	};


	/**
	 * Attach event handlers
	 */
	var attachEventHandlers = function() {
		window.addEventListener('mouseup', handleWindowMouseUp);
	};


	/**
	 * Wrap all words
	 *
	 * @param el Target DOM element
	 */
	var wrapAllWordsInElement = function(el) {
		el.innerHTML = el.innerHTML.replace(/([^\s-.,;:!?()[\]{}<>"]+)/g, '<' + wrapElName + '>$1</' + wrapElName + '>');
	};

	/**
	 * Event handler for mouseup event
	 * mouseup event is fired when user releases a mouse click or drag
	 *
	 * @param e
	 */
	// 1. Get selection
	// 2. Check whether the user has began and ended the highlight in words, or in whitespaces or other chars (dot, semicolon, etc)
	// 3. Highlight
	function handleWindowMouseUp(e) {
		// Get current selection (range to highlight)
		var selection = window.getSelection ? window.getSelection() : document.selection;

		// If no selection has made, do nothing and return
		if (selection.toString().trim() == "") {
			return;
		}

		// The Node in which the selection begins
		var startNode = selection.anchorNode;

		// The Node in which the selection ends
		var endNode = selection.focusNode;

		// If user selected in reverse direction, swap start and end node
		if (startNode.compareDocumentPosition(endNode) & Node.DOCUMENT_POSITION_PRECEDING) {
			var tempNode = startNode;
			startNode = endNode;
			endNode = tempNode;
		}

		var beginParagraphEl, beginSpanEl, endParagraphEl, endSpanEl;

		if (startNode.parentNode.nodeName.toLowerCase() === wrapElName.toLowerCase()) {
			beginParagraphEl = startNode.parentNode.parentNode;
			beginSpanEl = startNode.parentNode;
		} else if (startNode.parentNode.nodeName === "P") {
			beginParagraphEl = startNode.parentNode;
			beginSpanEl = startNode.nextSibling;
		}

		if (endNode.parentNode.nodeName.toLowerCase() === wrapElName.toLowerCase()) {
			endParagraphEl = endNode.parentNode.parentNode;
			endSpanEl = endNode.parentNode;
		} else if (endNode.parentNode.nodeName === "P") {
			endParagraphEl = endNode.parentNode;
			endSpanEl = endNode.previousSibling;
		}

		var highlightedInnerHTML;
		var isHighlighting = false;
		var isHighlightComplete = false;

		var originalStatus = [];

		// Highlight
		paragraphEls.forEach(function (pEl) {
			// If highlighting is complete
			// or highlighting hasn't started but we haven't reached the beginning paragraph,
			// do nothing and skip iteration
			if (isHighlightComplete || (!isHighlighting && (pEl !== beginParagraphEl))) {
				return;
			}

			highlightedInnerHTML = '';

			if (isHighlighting) {
				highlightedInnerHTML += '<' + highlightElName + ' style="background-color: ' + highlightColor + ';">';
			}

			pEl.childNodes.forEach(function (el) {
				if (el === beginSpanEl) {
					isHighlighting = true;

					highlightedInnerHTML += '<' + highlightElName + ' style="background-color: ' + highlightColor + ';">';
					highlightedInnerHTML += el.innerText;
				}

				else if (el === endSpanEl) {
					isHighlighting = false;
					isHighlightComplete = true;

					highlightedInnerHTML += el.innerText + '</' + highlightElName + '>';
				}

				else if (isHighlighting) {
					if (el.nodeType === ELEMENT_NODE_TYPE) {
						highlightedInnerHTML += el.innerText;
					} else if (el.nodeType === TEXT_NODE_TYPE) {
						highlightedInnerHTML += el.nodeValue;
					}
				}

				else if (!isHighlighting) {
					if (el.nodeName.toLowerCase() === highlightElName) {
						highlightedInnerHTML += el.outerHTML;
					}
					else if (el.nodeType === ELEMENT_NODE_TYPE) {
						highlightedInnerHTML += el.outerHTML;
					} else if (el.nodeType === TEXT_NODE_TYPE) {
						highlightedInnerHTML += el.nodeValue;
					}
				}
			}); // END: pEl.childNodes.forEach(function(el, index, childNodes) {}

			if (isHighlighting) {
				highlightedInnerHTML += '</' + highlightElName + '>';
			}

			// Save a patch to highlight history
			originalStatus.push({
				el: pEl,
				html: pEl.innerHTML
			});

			// Render
			pEl.innerHTML = highlightedInnerHTML;
		}); // END: paragraphEls.forEach(function(pEl, pIndex, pEls) {}

		undoHistoryStack.push(originalStatus);
		redoHistoryStack = [];

		// Remove selection if highlighting is complete
		if (isHighlightComplete) {
			if (selection.removeAllRanges) {
				selection.removeAllRanges();
			} else if (selection.empty) {
				selection.empty();
			}
		}
	}

	/**
	 * Restore changed elements to original state
	 * Used internally to perform undo/redo actions
	 *
	 * @param stateToRestore
	 * @returns {Array}
	 */
	var restore = function(stateToRestore) {
		var originalState = [];

		for (var i = 0; i < stateToRestore.length; i++) {
			var status = stateToRestore[i];

			originalState.push({
				el: status.el,
				html: status.el.innerHTML
			});

			status.el.innerHTML = status.html;
		}

		stateToRestore.html = status.innerHTML;

		return originalState;
	};


	/**
	 * Undo highlighting action
	 *
	 * If no previous state exists, this function will do nothing
	 */
	this.undo = function() {
		// If no state exists for undoing, do nothing
		if (undoHistoryStack.length === 0) {
			return;
		}

		var stateToRestore = undoHistoryStack.pop();
		var originalState = restore(stateToRestore);

		redoHistoryStack.push(originalState);
	};


	/**
	 * Redo highlighting action
	 *
	 * If at latest state, do nothing
	 */
	this.redo = function() {
		// If no state exists for redoing, do nothing
		if (redoHistoryStack.length === 0) {
			return;
		}

		var stateToRestore = redoHistoryStack.pop();
		var originalState = restore(stateToRestore);

		undoHistoryStack.push(originalState);
	};


	/**
	 * Getter for highlighting color
	 *
	 * @returns {string} current highlighting color
	 */
	this.getColor = function() {
		return highlightColor;
	};


	/**
	 * Setter for highlighting color
	 *
	 * @param newColor new highlighting color
	 */
	this.setColor = function(newColor) {
		highlightColor = newColor;
	};

	init();
}