import React, { useRef, useEffect, useState, memo } from 'react'
import path from 'path-browserify';
import Sortable from 'sortablejs';

// const imageExtention = [
//   '.png',
//   '.jpg',
//   '.gif',
//   '.tiff',
//   '.tif',
//   '.webp',
//   '.svg',
// ];

// This is a work-around.
// `path.resolve` executes a function that cannot be executed by the browser.
// https://github.com/browserify/path-browserify/blob/v1.0.1/index.js#L124
path.resolve = (a) => '/' + a;

const pathRelated = (pathA, pathB) => {
  const isParent = (parent, child) => {
    const relative = path.relative(parent, child);
    return relative && relative !== '' && !relative.startsWith('..');
  };
  return isParent(pathA, pathB) || isParent(pathB, pathA);
};

const defaultFolders = ['plugins', 'script'];

const VirtualInstallation = memo((props) => {
  const listDownload = useRef(null);
  const listAviutl = useRef(null);

  const [rootSortable, setRootSortable] = useState();
  const [sortables, setSortables] = useState([]);

  useEffect(() => {
    // clearList
    if (listDownload.current)
      listDownload.current.innerHTML = null;
    if (listAviutl.current)
      listAviutl.current.innerHTML = null;

    // This should be recursive
    setSortables(defaultFolders
      .map((f) => {
        const entry = document.createElement('div');
        entry.innerText = f;
        entry.dataset.id = f;
        entry.classList.add('list-group-item');
        entry.classList.add('list-group-item-dark');
        entry.classList.add('ignore-elements');

        const entry2 = document.createElement('div');
        entry2.classList.add('list-group');
        entry2.classList.add('nested-sortable');
        entry.appendChild(entry2);

        listAviutl.current.appendChild(entry);

        return {
          id: f,
          sortable: new Sortable(entry2, {
            group: 'nested',
            animation: 150,
            filter: '.ignore-elements',
            fallbackOnBody: true,
            invertSwap: true,
            invertedSwapThreshold: 0.6,
            emptyInsertThreshold: 8,
          })
        };
      }));

    const filesWirhSri = Object.entries(props.files).map(([k, v]) => { return { name: k, sri: v, folder: false } });
    const folders = [...new Set(filesWirhSri.map(f => path.dirname(f.name)))].filter(n => n !== '.').map(n => { return { name: n, folder: true } });
    const dirEntries = [].concat(filesWirhSri, folders);

    dirEntries
      .forEach((f) => {
        const entry = document.createElement('div');
        entry.innerText = f.name;
        entry.dataset.id = f.name;
        entry.classList.add('list-group-item');
        if (f.folder) {
          if (['plugins', 'script'].includes(path.basename(f.name))) {
            entry.classList.add('list-group-item-dark');
            entry.classList.add('ignore-elements');
          } else {
            entry.classList.add('list-group-item-warning');
          }
        }
        listDownload.current.appendChild(entry);
      });
  }, [props.files]);

  useEffect(() => {
    const filesWirhSri = Object.entries(props.files).map(([k, v]) => { return { name: k, sri: v, folder: false } });
    const folders = [...new Set(filesWirhSri.map(f => path.dirname(f.name)))].filter(n => n !== '.').map(n => { return { name: n, folder: true } });
    const dirEntries = [].concat(filesWirhSri, folders);

    const getEntries = (sortable, currentDir) =>
      sortable.toArray()
        .flatMap((i) => {
          const fullPath = path.join(currentDir, path.basename(i));
          const childSortable = sortables.find(s => s.id === fullPath);
          if (childSortable) {
            return getEntries(childSortable.sortable, fullPath);
          } else {
            return [{
              id: i,
              archivePath: path.dirname(i),
              targetPath: fullPath
            }];
          }
        });

    const makeXML = () => {
      const files = getEntries(rootSortable, '');
      const filesJson = files
        .map((i) => {
          const ret = { 'filename': i.targetPath };
          ret['archivePath'] = (i.archivePath === '.') ? null : i.archivePath;
          ret['isDirectory'] = !!dirEntries.find(e => e.name === i.id).folder;
          ret['isOptional'] = false;
          return ret;
        });
      const integrities = files
        .flatMap((i) => {
          const fileEntry = dirEntries.find(e => e.name === i.id);
          if (fileEntry.folder) return [];
          return [{
            'targetIntegrity': fileEntry.sri,
            'target': i.targetPath
          }];
        });
      props.onChange(filesJson, integrities);
    };
    if (rootSortable)
      rootSortable.options.onSort = makeXML;
    sortables.forEach(s => s.sortable.options.onSort = makeXML);
  }, [props, rootSortable, sortables]);

  useEffect(() => {
    const usedPath = new Set();

    const updateMovableEntry = () => {
      for (const node of listDownload.current.children) {
        node.classList.remove('list-group-item-dark');
        node.classList.remove('ignore-elements');

        const nodePath = node.dataset.id;
        if (defaultFolders.includes(path.basename(nodePath)) || Array.from(usedPath).find(used => pathRelated(nodePath, used))) {
          node.classList.add('list-group-item-dark');
          node.classList.add('ignore-elements');
        }
      }
    };

    new Sortable(listDownload.current, {
      group: 'nested',
      animation: 150,
      filter: '.ignore-elements',
      fallbackOnBody: true,
      sort: false,
      onRemove: (event) => {
        const itemPath = event.item.dataset.id;
        usedPath.add(itemPath);
        updateMovableEntry();
      },
      onAdd: (event) => {
        const itemPath = event.item.dataset.id;
        usedPath.delete(itemPath);
        updateMovableEntry();
      },
    });

    setRootSortable(
      new Sortable(listAviutl.current, {
        group: 'nested',
        animation: 150,
        filter: '.ignore-elements',
        fallbackOnBody: true,
        invertSwap: true,
        invertedSwapThreshold: 0.6,
        emptyInsertThreshold: 8,
      })
    );
  }, [setRootSortable]);

  return (
    <div className="row my-2">
      <div className="col">
        <div className="card">
          <div className="card-body">
            Zipファイル
            <div ref={listDownload} className="list-group"></div>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card">
          <div className="card-body">
            Aviutl
            <div ref={listAviutl} className="list-group nested-sortable">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default VirtualInstallation;
