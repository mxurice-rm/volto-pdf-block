import React from 'react';
import PropTypes from 'prop-types';
import config from '@plone/volto/registry';
import PDF from '@mikecousins/react-pdf';

import { Icon } from '@plone/volto/components';
import zoomInSVG from '@plone/volto/icons/add.svg';
import zoomOutSVG from '@plone/volto/icons/remove.svg';
import downloadSVG from '@plone/volto/icons/move-down.svg';

import './pdf-styling.css';

// Based on
// https://raw.githubusercontent.com/MGrin/mgr-pdf-viewer-react/master/src/index.js

const mgrpdfStyles = {};

mgrpdfStyles.wrapper = {
  textAlign: 'center',
};

const LoaderComponent = ({ canvas }) => (
  <div
    className="block pdf_viewer selected"
    tabindex="-1"
    style={{ outline: 'none', height: '100%' }}
  >
    <div className="ui message">
      <div
        className="ui active transition visible dimmer"
        style={{ display: 'flex !important;' }}
      ></div>
      <div
        className="ui active transition visible dimmer"
        style={{ display: 'flex !important;' }}
      >
        <div className="content">
          <div className="ui indeterminate text loader"></div>
        </div>
      </div>
      {canvas}
    </div>
  </div>
);

const PDFToolbar = ({ downloadUrl, onScaleUp, onScaleDown, scale_ratio }) => (
  <div className="pdf-toolbar pdf-toolbar-top">
    <div>
      <button className="pdf-toolbar-btn" title="Zoom In" onClick={onScaleUp}>
        <Icon name={zoomInSVG} size="15px" />
      </button>
      <div className="scale-separator" />
      <button
        className="pdf-toolbar-btn"
        title="Zoom Out"
        onClick={onScaleDown}
      >
        <Icon name={zoomOutSVG} size="15px" />
      </button>
      <p className="scale-ratio">{scale_ratio + '%'}</p>
    </div>
    <div>
      <a href={downloadUrl}>
        <button className="pdf-toolbar-btn" title="Download">
          <Icon name={downloadSVG} size="15px" />
        </button>
      </a>
    </div>
  </div>
);

function PDFViewer({
  page = 1,
  initialScale = 1.0,
  initial_scale_ratio = 100,
  loader,
  hideNavbar,
  navigation: NavigationElement,
  css,
  document: source,
  showToolbar = true,
}) {
  const [scale, setScale] = React.useState(initialScale);
  const [scale_ratio, setScale_ratio] = React.useState(initial_scale_ratio);
  const [totalPages, setTotalPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(page);

  const [loading, setLoading] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    setCurrentPage(page || 1);
  }, [page]);

  const increaseScale = () => {
    setScale(scale + 0.1);
    setScale_ratio(scale_ratio + 10);
  };
  const decreaseScale = () => {
    setScale(scale - 0.1);
    setScale_ratio(scale_ratio - 10);
  };

  const handlePrevClick = () => {
    if (currentPage === 1) return;
    setCurrentPage(currentPage - 1);
  };

  const handleNextClick = () => {
    if (currentPage === totalPages) return;
    setCurrentPage(currentPage + 1);
  };

  React.useLayoutEffect(() => {
    function handleWheel(event) {
      if (event.deltaY < 0) {
        setCurrentPage(Math.max(currentPage - 1, 1));
      } else if (event.deltaY > 0) {
        setCurrentPage(Math.min(currentPage + 1, totalPages));
      }

      event.preventDefault();
    }

    const pdfWrapper = document.querySelector('.pdf-wrapper');
    if (pdfWrapper) {
      pdfWrapper.addEventListener('wheel', handleWheel);
    }
    return () => {
      const pdfWrapper = document.querySelector('.pdf-wrapper');
      if (pdfWrapper) {
        pdfWrapper.addEventListener('wheel', handleWheel);
      }
    };
  }, [currentPage, totalPages]);

  return (
    <div
      className={!loading && css ? css : 'mgrpdf__wrapper'}
      style={mgrpdfStyles.wrapper}
    >
      {showToolbar && (
        <PDFToolbar
          onScaleUp={increaseScale}
          onScaleDown={decreaseScale}
          downloadUrl={source.url}
          scale_ratio={scale_ratio}
        />
      )}
      <PDF
        file={source.file || source.url}
        content={source.base64}
        binaryContent={source.binary}
        documentInitParameters={source.connection}
        loading={loader || loading}
        page={page}
        scale={scale}
        onPageRenderSuccess={() => {
          setLoading(false);
          setLoaded(true);
        }}
        onPageRenderFail={() => {
          setLoading(false);
          setLoaded(false);
        }}
        workerSrc={config.settings.pdfWorkerSrc}
        onDocumentLoadSuccess={(pages) => {
          setLoaded(true);
          setTotalPages(pages);
        }}
      >
        {({ pdfDocument, pdfPage, canvas }) => {
          // console.log('pdf', pdfDocument, pdfPage, canvas, source);
          return loaded ? canvas : <LoaderComponent canvas={canvas} />;
        }}
      </PDF>

      {!hideNavbar && totalPages > 0 ? (
        <NavigationElement
          page={currentPage}
          pages={totalPages}
          handleNextClick={handleNextClick}
          handlePrevClick={handlePrevClick}
        />
      ) : null}
    </div>
  );
}

PDFViewer.propTypes = {
  document: PropTypes.shape({
    file: PropTypes.any, // File object,
    url: PropTypes.string,
    connection: PropTypes.shape({
      url: PropTypes.string.isRequired, // URL to fetch the pdf
    }),
    base64: PropTypes.string, // PDF file encoded in base64
    binary: PropTypes.shape({
      // UInt8Array
      data: PropTypes.any,
    }),
  }).isRequired,

  loader: PropTypes.node,
  page: PropTypes.number,
  scale: PropTypes.number,
  css: PropTypes.string,
  // onDocumentClick: PropTypes.func,
  // onDocumentComplete: PropTypes.func,

  hideNavbar: PropTypes.bool,
  navigation: PropTypes.oneOfType([
    // Can be an object with css classes or react elements to be rendered
    PropTypes.shape({
      css: PropTypes.shape({
        previousPageBtn: PropTypes.string,
        nextPageBtn: PropTypes.string,
        pages: PropTypes.string,
        wrapper: PropTypes.string,
      }),
      elements: PropTypes.shape({
        previousPageBtn: PropTypes.any,
        nextPageBtn: PropTypes.any,
        pages: PropTypes.any,
      }),
    }),
    // Or a full navigation component
    PropTypes.any,
  ]),
};

PDFViewer.defaultProps = {
  scale: 1,
};

export default PDFViewer;
