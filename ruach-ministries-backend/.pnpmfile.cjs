module.exports = {
    hooks: {
      readPackage(pkg) {
        if (pkg.dependencies && pkg.dependencies.typescript) {
          pkg.dependencies.typescript = "5.3.3";
        }
        if (pkg.devDependencies && pkg.devDependencies.typescript) {
          pkg.devDependencies.typescript = "5.3.3";
        }
        return pkg;
      },
    },
  };