var DemoApp = function(highlighter) {
	var _this = this;

	// Select all keyword item DOM elements
	var keywordItemEls = document.querySelectorAll('.item-keyword');
	var currentActiveItem = null;

	var init = function() {
		attachEventHandlers();
	};

	/**
	 *  Attach event handlers
	 */
	var attachEventHandlers = function() {
		document.addEventListener('keydown', handleKeyDown);
	};

	/**
	 * Event handler for keydown event
	 *
	 * @param e Keydown event object
	 */
	var handleKeyDown = function(e) {
		var evtObj = window.event ? event : e;

		// Keypress event's metaKey property refers to
		// a Mac's command (Apple) key
		if (evtObj.metaKey || evtObj.ctrlKey) {
			// Undo (ctrl+z)
			if (evtObj.keyCode === 90) {
				highlighter.undo();
			}

			// Redo (ctrl+y)
			else if (evtObj.keyCode === 89) {
				highlighter.redo();
			}
		}

		else {
			// Left arrow or Page Up key
			if (evtObj.keyCode === 37 || evtObj.keyCode === 33) {
				moveToPrevPage();
			}

			// Right arrow or Page Down Key
			else if (evtObj.keyCode === 39 || evtObj.keyCode === 34) {
				moveToNextPage();
			}
		}
	};

	/**
	 * Activate a specific keyword
	 *
	 * @param itemEl Keyword item to activate
	 */
	var activateKeyword = function(itemEl) {
		// If item is already active, do nothing
		if (currentActiveItem === itemEl) {
			return;
		}

		if (currentActiveItem) {
			deactivateItem(currentActiveItem);
		}

		currentActiveItem = itemEl;

		highlightColor = itemEl.dataset.highlightColor;

		highlighter.setColor(highlightColor);

		var highlightKeywordEl = itemEl.querySelector('.highlight-keyword');

		itemEl.classList.add('active');

		highlightKeywordEl.style.backgroundColor = highlightColor;
	};

	/**
	 * Deactivate a specific keyword
	 *
	 * @param itemEl Keyword item to deactivate
	 */
	var deactivateItem = function(itemEl) {
		var highlightColor = itemEl.dataset.highlightColor;
		var highlightColorEl = itemEl.querySelector('.highlight-color');
		var highlightKeywordEl = itemEl.querySelector('.highlight-keyword');

		highlightColorEl.style.backgroundColor = highlightColor;
		itemEl.classList.remove('active');
		highlightKeywordEl.style.backgroundColor = '';

	};

	keywordItemEls.forEach(function (itemEl) {
		// Initialize and create color
		var highlightColor = itemEl.dataset.highlightColor;
		var highlightColorEl = itemEl.querySelector('.highlight-color');

		highlightColorEl.style.backgroundColor = highlightColor;

		itemEl.addEventListener('click', function (e) {
			activateKeyword(itemEl);

			e.preventDefault();
		});

		var clearBtnEl = itemEl.querySelector('.btn-clear');

		clearBtnEl.addEventListener('click', function(e) {
			e.preventDefault();
			e.stopPropagation();

			highlighter.clearHighlightsByColor(highlightColor);
		}, true);
	});


	_this.run = function() {
		init();
	};
};