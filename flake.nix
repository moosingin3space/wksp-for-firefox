{
  description = "Workspaces for Firefox";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    utils.url = "github:numtide/flake-utils";
    flake-compat = {
      url = "github:edolstra/flake-compat";
      flake = false;
    };
    npm-buildpackage.url = "github:serokell/nix-npm-buildpackage";
  };

  outputs = { self, nixpkgs, utils, npm-buildpackage, ... }:
    let
      name = "wksp-for-firefox";
    in
    utils.lib.eachDefaultSystem
    (system:
      let
        pkgs = import nixpkgs { inherit system; };
        project = npm-buildpackage.buildYarnPackage {
          src = ./.;
          yarnBuild = "yarn build";
        };
        buildInputs = with pkgs; [
          nodejs
        ];
        nativeBuildInputs = with pkgs; [
          nixpkgs-fmt
        ];
      in
      rec {
        packages.${name} = project;

        # `nix build`
        defaultPackage = packages.${name};

        # `nix develop`
        devShell = pkgs.mkShell {
          inherit buildInputs nativeBuildInputs;
        };
      }
    );
}
