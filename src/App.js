import React, { useState, useEffect } from 'react';
import './App.css';
import SurveyComponent from './SurveyComponent';
import { PackagesList } from './parseXML';

const formsUrl =
  'https://docs.google.com/forms/d/e/1FAIpQLSfxQWxsCp9QQYHpe9oxL4gZEdJmMVQxFZijXKI1NmygeHgHkg/viewform?usp=pp_url';
const formsAttribute = { name: 'entry.1336975935', data: 'entry.447338863' };

function makeFormsUrl(data) {
  let url = formsUrl;
  for (const key of Object.keys(formsAttribute)) {
    if (Object.prototype.hasOwnProperty.call(data, key))
      url += '&' + formsAttribute[key] + '=' + encodeURIComponent(data[key]);
  }
  return url;
}

function App() {
  const [packageItem, setPackageItem] = useState();
  const [packages, setPackages] = useState({});
  const [addedPackages, setAddedPackages] = useState({});

  useEffect(() => {
    async function fetchXML() {
      const text = await (
        await fetch(
          'https://cdn.jsdelivr.net/gh/hal-shu-sato/apm-data@main/v2/data/packages.xml'
        )
      ).text();
      setPackages(new PackagesList(text));
    }
    fetchXML();
  }, []);

  function complete(json) {
    const newPackages = { ...addedPackages };
    newPackages[json.id] = json;
    setAddedPackages(newPackages);
  }

  function submit() {
    window.open(
      makeFormsUrl({ data: PackagesList.write(Object.values(addedPackages)) })
    );
  }

  function createItem(p, badge) {
    function removeItem(id) {
      const newPackages = { ...addedPackages };
      delete newPackages[id];
      setAddedPackages(newPackages);
    }

    return (
      <div
        className={
          'list-group-item list-group-item-action position-relative' +
          (p.id === packageItem?.id ? ' active' : '')
        }
        key={p.id}
        onClick={() => setPackageItem(p)}
      >
        {badge === 'new' && <span className="badge bg-success me-2">New</span>}
        {badge === 'edit' && (
          <span className="badge bg-warning me-2">Edit</span>
        )}
        {p?.name ? p.name : p.id}
        {['new', 'edit'].includes(badge) && (
          <div
            className="position-absolute top-50 end-0 translate-middle-y fs-4 px-3"
            onClick={() => removeItem(p.id)}
          >
            ×
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-light">
      <div className="d-flex flex-column h-100">
        <nav className="navbar navbar-expand-lg navbar-light">
          <div className="container-fluid">
            <span className="navbar-brand">
              <img src="../icon/apm32.png" alt="" className="d-inline-block" />
              <span className="align-middle">apm-web</span>
            </span>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item me-3">
                  <div className="nav-link" onClick={() => setPackageItem({})}>
                    <i className="bi bi-plus-square me-2"></i>
                    新規パッケージ
                  </div>
                </li>
                <li className="nav-item me-3">
                  <a
                    className="nav-link"
                    href="https://github.com/hal-shu-sato/apm-data/issues"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="bi bi-github me-2"></i>
                    最新のリクエスト状況を確認する
                  </a>
                </li>
              </ul>
              <form className="d-flex">
                <button
                  className="btn btn-success"
                  onClick={submit}
                  type="button"
                >
                  <i className="bi bi-send me-2"></i>
                  パッケージを送信
                </button>
              </form>
            </div>
          </div>
        </nav>
        <div className="flex-grow-1 overflow-auto">
          <div className="row g-0 h-100 card border-0 rounded-0">
            <div className="row g-0 h-100 card-body p-0">
              <div className="col-sm-3 overflow-auto h-100 list-group list-group-flush user-select-none">
                {Object.values(addedPackages)
                  .filter(
                    (p) => !Object.prototype.hasOwnProperty.call(packages, p.id)
                  )
                  .map((p) => createItem(p, 'new'))}
                {Object.values(addedPackages)
                  .filter((p) =>
                    Object.prototype.hasOwnProperty.call(packages, p.id)
                  )
                  .map((p) => createItem(p, 'edit'))}
                {Object.values(packages)
                  .filter(
                    (p) =>
                      !Object.prototype.hasOwnProperty.call(addedPackages, p.id)
                  )
                  .map((p) => createItem(p))}
              </div>
              <div className="col-sm-9 overflow-auto h-100">
                <SurveyComponent
                  packageItem={packageItem}
                  onComplete={complete}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
