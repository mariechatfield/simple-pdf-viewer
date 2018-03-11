'use strict';

(function() {
  // Default size preferences to render each page
  const DEFAULT_MIN_SIZE = 100;
  const DEFAULT_SIZE = 350;
  const DEFAULT_MAX_SIZE = 2000;
  const DEFAULT_SIZE_STEP = 50;
  const DEFAULT_SCALE = 1.0;

  // The minimum size in pixels of each page at which
  // each filter description should be visible
  const SIZE_WIDE_ENOUGH_FOR_DESCRIPTION = 200;

  // List of filters to display.
  // `name` and `description` are used to display
  // filter information.
  // `filter` maps to an SVG filter defined on the page
  // (source: https://raw.githubusercontent.com/Altreus/colourblind/master/colourblind.svg)
  const FILTERS = [
    {
      name: 'No Filter',
      description: 'Original image with no modifications.',
      filter: null
    },
    {
      name: 'Protanopia',
      description: 'Inability to perceive red light.',
      filter: 'protanopia'
    }, {
      name: 'Protanomaly',
      description: 'Reduced sensitivity to red light.',
      filter: 'protanomaly'
    }, {
      name: 'Deuteranopia',
      description: 'Inability to perceive green light.',
      filter: 'deuteranopia'
    }, {
      name: 'Deuteranomaly',
      description: 'Reduced sensitivity to green light.',
      filter: 'deuteranomaly'
    }, {
      name: 'Tritanopia',
      description: 'Inability to perceive blue light.',
      filter: 'tritanopia'
    }, {
      name: 'Tritanomaly',
      description: 'Reducted sensitivity to blue light.',
      filter: 'tritanomaly'
     }, {
      name: 'Achromatopsia',
      description: 'Inability to percieve any colors.',
      filter: 'achromatopsia'
     }, {
      name: 'Achromatomaly',
      description: 'Reduced sensitivity to all colors.',
      filter: 'achromatomaly'
     }
  ];

  // Loaded via <script> tag, create shortcut to access PDF.js exports.
  const pdfjs = window['pdfjs-dist/build/pdf'];

  /**
   * Load PDF from source and render.
   * @param  {String} name        Name of file to display.
   * @param  {Object} source      Source of PDF. See documentation for `PDFjs.getDocument` for valid types: https://github.com/mozilla/pdf.js/blob/master/src/display/api.js
   */
  function loadPDF(name, source) {
    pdfjs.getDocument(source).then(function(pdfDoc) {
      const pdfContainer = buildPDFContainer(name, pdfDoc);

      // Add container for rendered page from PDF
      const currentPageNode = document.createElement('div');
      pdfContainer.appendChild(currentPageNode);

      // Set up buttons to handle clicks and navigate within PDF
      setupNavButtons(pdfDoc, currentPageNode);

      // Load first page and add to the container
      loadPageAndRender(pdfDoc, 1, currentPageNode);
    });
  }

  /**
   * Build DOM to render PDF, with information on file and navigation.
   *
   * @param  {Object} pdfDoc          Loaded PDF document from PDF.js
   * @return {Node} The top-level Node into which content is rendered.
   */
  function buildPDFContainer(name, pdfDoc) {
    // Clear existing container
    const pdfContainer = document.getElementById('container');
    pdfContainer.innerHTML = '';

    const borderBox = document.createElement('div');
    borderBox.className = 'border-box border-box--blue space-items';

    // Add PDF information to container (title and number of pages)
    const information = document.createElement('div');
    information.className = 'pdf__information';

    const title = document.createElement('h3');
    title.textContent = name;

    const pageCount = document.createElement('div');
    pageCount.textContent = `${pdfDoc.numPages} Pages`;

    // Add buttons to navigate back and forth in PDF
    const buttonsContainer = document.createElement('div');

    const navigationButtons = document.createElement('div');
    navigationButtons.className = 'pdf__buttons';

    const previousButton = document.createElement('button');
    previousButton.textContent = 'Previous Page';
    previousButton.id = 'previousButton';

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next Page';
    nextButton.id = 'nextButton';

    // Add buttons to change page size

    const sizeButtons = document.createElement('div');
    sizeButtons.className = 'pdf__buttons';

    const sizeInput = document.createElement('input');
    sizeInput.id = 'pageSize';
    sizeInput.type = 'range';
    sizeInput.min = DEFAULT_MIN_SIZE;
    sizeInput.max = DEFAULT_MAX_SIZE;
    sizeInput.step = DEFAULT_SIZE_STEP;
    sizeInput.value = DEFAULT_SIZE;

    const sizeDecrementLabel = document.createElement('i');
    sizeDecrementLabel.className = 'fa fa-search-minus';

    const sizeIncrementLabel = document.createElement('i');
    sizeIncrementLabel.className = 'fa fa-search-plus';

    navigationButtons.appendChild(previousButton);
    navigationButtons.appendChild(nextButton);
    buttonsContainer.appendChild(navigationButtons);

    sizeButtons.appendChild(sizeDecrementLabel);
    sizeButtons.appendChild(sizeInput);
    sizeButtons.appendChild(sizeIncrementLabel);
    buttonsContainer.appendChild(sizeButtons);

    information.appendChild(title);
    information.appendChild(pageCount);

    borderBox.appendChild(information);
    borderBox.appendChild(buttonsContainer);

    pdfContainer.appendChild(borderBox);

    return pdfContainer;
  }

  /**
   * Initialize navigation buttons.
   *
   * @param  {Object} pdfDoc          Loaded PDF document from PDF.js
   * @param  {Node} currentPageNode   DOM node which should be used to render page content.
   */
  function setupNavButtons(pdfDoc, currentPageNode) {
    let currentPage = 1;

    const minPages = 1;
    const maxPages = pdfDoc.numPages;

    const nextButton = document.getElementById('nextButton');
    const previousButton = document.getElementById('previousButton');

    const updateButtonState = () => {
      if (currentPage == maxPages) {
        nextButton.disabled = true;
      } else {
        nextButton.disabled = false;
      }

      if (currentPage == minPages) {
        previousButton.disabled = true;
      } else {
        previousButton.disabled = false;
      }
    };

    updateButtonState();

    nextButton.addEventListener('click', function() {
      if (currentPage < maxPages) {
        currentPage += 1;
        updateButtonState();
        loadPageAndRender(pdfDoc, currentPage, currentPageNode);
      }
    });

    previousButton.addEventListener('click', function() {
      if (currentPage > minPages) {
        currentPage -= 1;
        updateButtonState();
        loadPageAndRender(pdfDoc, currentPage, currentPageNode);
      }
    });

    const sizeInput = document.getElementById('pageSize');

    sizeInput.addEventListener('change', function() {
      loadPageAndRender(pdfDoc, currentPage, currentPageNode);
    });
  }

  /**
   * Load a page from a PDF and add it to the given DOM node.
   *
   * @param  {Object} pdfDoc          Loaded PDF document from PDF.js
   * @param  {Number} pageNum         Page number to load (starts at 1, not 0)
   * @param  {Node} currentPageNode   DOM node that the loaded PDF should be added to.
   */
  function loadPageAndRender(pdfDoc, pageNum, currentPageNode) {
    pdfDoc.getPage(pageNum).then(function(page) {
      updateSizeInput(page);
      renderPageIntoNode(page, pageNum, currentPageNode);
    });
  }

  /**
   * Render page from a PDF into a canvas and add to given node.
   *
   * @param  {Object} page    Page that has been loaded from a PDF.js PDFDoc.
   * @param  {Number} pageNum The number that describes the given page, used for a title.
   * @param  {Node} pageNode  DOM node that the loaded PDF should be added to.
   */
  function renderPageIntoNode(page, pageNum, pageNode) {
    // Clear existing content
    pageNode.innerHTML = '';

    const viewport = page.getViewport(calculateScale(page));

    const title = document.createElement('h3');
    title.textContent = `Page ${pageNum}`;
    title.className = 'divider';
    pageNode.appendChild(title);

    const allFilters = document.createElement('div');
    allFilters.className = 'pdf-page';
    pageNode.appendChild(allFilters);

    FILTERS.forEach(filterType => {
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (filterType.filter) {
        canvas.style.filter = `url(#${filterType.filter})`;
      }

      const filterContainer = document.createElement('div');
      filterContainer.className = 'pdf-page__filter';

      const filterTitle = document.createElement('h4');
      filterTitle.textContent = filterType.name;
      filterTitle.className = 'divider';

      const sizeInput = document.getElementById('pageSize');
      const pageSize = Number(sizeInput.value);

      if (pageSize >= SIZE_WIDE_ENOUGH_FOR_DESCRIPTION) {
        const filterDescription = document.createElement('small');
        filterDescription.className = 'pdf-page__filter__description';
        filterDescription.textContent = filterType.description;
        filterTitle.appendChild(filterDescription);
      }

      filterContainer.appendChild(filterTitle);

      filterContainer.appendChild(canvas);
      allFilters.appendChild(filterContainer);

      const canvasContext = canvas.getContext('2d');

      // Render PDF page into canvas context, asynchronously
      page.render({
        canvasContext,
        viewport
      });
    });
  }

  /**
   * Calculate scale to use when rendering page, based on user-selected size.
   *
   * @param  {Object} page    Page that has been loaded from a PDF.js PDFDoc.
   * @return {number}         Scale to use when rendering page.
   */
  function calculateScale(page) {
    const sizeInput = document.getElementById('pageSize');
    const targetSize = Number(sizeInput.value);

    const [x1, y1, x2, y2] = page.view;
    const pageWidth = x2 - x1;
    const pageHeight = y2 - y1;

    const xScale = targetSize / pageWidth;
    const yScale = targetSize / pageHeight;

    return Math.min(DEFAULT_SCALE, xScale, yScale);
  }

  /**
   * Update size input maximum so that it never exceeds actual page size.
   *
   * @param  {Object} page    Page that has been loaded from a PDF.js PDFDoc.
   */
  function updateSizeInput(page) {
    const sizeInput = document.getElementById('pageSize');
    const maxSize = sizeInput.max;

    const [x1, y1, x2, y2] = page.view;
    const pageWidth = x2 - x1;
    const pageHeight = y2 - y1;

    const maxDimension = Math.max(pageWidth, pageHeight);

    if (maxDimension < maxSize) {
      sizeInput.max = maxDimension - (maxDimension % DEFAULT_SIZE_STEP);
    }
  }

  /**
   * One-time setup, to be done when page first loads.
   * @return {[type]} [description]
   */
  function initialize() {
    // Config for PDF.js
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.428/pdf.worker.min.js';

    // Load PDF whenever the user selects a new file
    const fileInput = document.getElementById('fileInput');

    fileInput.addEventListener('change', function() {
      const files = fileInput.files;
      const file = files && files[0];

      if (file) {
        const reader = new FileReader();
        reader.addEventListener('load', function(event) {
          loadPDF(file.name, event.target.result)
        });
        reader.readAsArrayBuffer(file);
      }
    });

    loadPDF('Sample PDF', 'sample.pdf');
  }

  initialize();
})();
