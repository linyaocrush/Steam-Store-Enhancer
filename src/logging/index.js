  const diagnostics = createDiagnostics({
    read: key => GM_getValue(key, null),
    write: (key, value) => GM_setValue(key, value),
    sink: console
  });
