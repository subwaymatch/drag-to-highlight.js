var runHighlightApp = function() {
	// Select all keyword item DOM elements
	var keywordItemEls = document.querySelectorAll('.item-keyword');
	var currentActiveItem = null;
	var pageEls = null;
	var paginationListEl = null;
	var currentPageIndex = null;
	var highlighter;

	var init = function() {
		generatePages();
		attachEventHandlers();

		var allPageEls = document.querySelectorAll('.page');

		highlighter = new DragToHighlight(allPageEls, {});

		// Activate the first keyword item
		activateKeyword(keywordItemEls[0]);
	};

	/**
	 *  Attach event handlers
	 */
	var attachEventHandlers = function() {
		window.addEventListener('mousewheel', handleMouseWheel);
		window.addEventListener('DOMMouseScroll', handleMouseWheel);

		document.addEventListener('keydown', handleKeyDown);
	};

	/**
	 * Event handler for mousewheel event
	 *
	 * @param e Mousewheel event object
	 */
	var handleMouseWheel = function(e) {
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		var isDownwards = (delta === -1) ? true : false;

		switchKeyword(isDownwards);
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
	 * Divide .page elements into separate pages
	 */
	var generatePages = function() {
		pageEls = document.querySelectorAll('#content .page');
		paginationListEl = document.querySelector('#list-pagination');

		if (pageEls.length > 0) {
			pageEls.forEach(function(pageEl, index) {
				var newListItemElement = document.createElement('LI');
				newListItemElement.innerHTML = index + 1;
				newListItemElement.dataset.index = index;

				newListItemElement.addEventListener('click', function() {
					activatePage(index);
				});

				paginationListEl.appendChild(newListItemElement);

				pageEl.style.display = 'none';
			});

			activatePage(0);
		}
	};

	/**
	 * Move to next page
	 */
	var moveToNextPage = function() {
		console.log('moveToNextPage()');

		if (currentPageIndex < pageEls.length - 1) {
			activatePage(currentPageIndex + 1);
		}
	};

	/**
	 * Move to previous page
	 */
	var moveToPrevPage = function() {
		console.log('moveToPrevPage()');

		if (currentPageIndex > 0) {
			activatePage(currentPageIndex - 1);
		}
	};

	/**
	 * Show a specific page
	 *
	 * @param newPageIndex Page to show
	 */
	var activatePage = function(newPageIndex) {
		// If user attempts to activate already active page, do nothing and return
		if (newPageIndex === currentPageIndex) {
			return;
		}

		var pageListEls = paginationListEl.querySelectorAll('li');

		if (currentPageIndex !== null) {
			pageEls[currentPageIndex].style.display = 'none';
			pageListEls[currentPageIndex].classList.remove('active');
		}

		pageEls[newPageIndex].style.display = 'block';
		pageListEls[newPageIndex].classList.add('active');

		currentPageIndex = newPageIndex;
	};

	/**
	 * Switch keyword with mouse scroll direction
	 *
	 * @param isDownwards Whether the user has scrolled downwards
	 */
	var switchKeyword = function(isDownwards) {
		keywordItemEls;

		if (currentActiveItem === null) {
			activateKeyword(keywordItemEls[0]);
		}

		else {
			var currentIndex = Array.prototype.indexOf.call(keywordItemEls, currentActiveItem);
			var numKeywords = keywordItemEls.length;

			if (isDownwards) {
				if (currentIndex == numKeywords - 1) {
					// Do nothing
				}

				else {
					activateKeyword(currentActiveItem.nextElementSibling);
				}
			}

			else {
				if (currentIndex == 0) {
					// Do nothing
				}

				else {
					activateKeyword(currentActiveItem.previousElementSibling);
				}
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
		if (currentActiveItem == itemEl) {
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

	keywordItemEls.forEach(function (itemEl, index, itemEls) {
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

	init();
};

document.addEventListener('DOMContentLoaded', function() {
	runHighlightApp();
});