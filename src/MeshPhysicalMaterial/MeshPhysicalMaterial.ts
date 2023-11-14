import {
  type MeshPhysicalMaterialParameters,
  ShaderLib,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shader,
} from "three";
import { buildFragment, buildUniforms } from "./meshphysicalhex.glsl";

export interface MeshPhysicalHexMaterialParameters
  extends MeshPhysicalMaterialParameters {
  patchScale?: number;
}

export const patchMeshPhysicalMaterial = () => {
  const baseFragmentShader = ShaderLib.physical.fragmentShader;
  const fragmentShader = buildFragment(baseFragmentShader);
  ShaderLib.physical.fragmentShader = fragmentShader;

  Object.assign(ShaderLib.physical.uniforms, buildUniforms());
};

const isNil = (value: any) => value === null || value === undefined;

declare module "three" {
  export interface MeshStandardMaterial {
    hexTiling?: {
      patchScale?: number;
    };
  }

  export interface MeshPhysicalMaterialParameters {
    hexTiling?: {
      patchScale?: number;
    };
  }
}

export const patchMeshStandardMaterial = () => {
  const baseFragmentShader = ShaderLib.standard.fragmentShader;
  const fragmentShader = buildFragment(baseFragmentShader);
  ShaderLib.standard.fragmentShader = fragmentShader;

  Object.assign(ShaderLib.standard.uniforms, buildUniforms());

  let shaderRef: Shader;
  MeshStandardMaterial.prototype.onBeforeCompile = function (shader, renderer) {
    shaderRef = shader;
    console.log("onBeforeCompile", shader, renderer);
  };

  MeshStandardMaterial.prototype.hexTiling = {};

  (MeshStandardMaterial.prototype as any).onBeforeRender = function () {
    if (!shaderRef) {
      return;
    }

    const params = this.hexTiling;
    if (!params) {
      return;
    }

    if (!isNil(params.patchScale)) {
      shaderRef.uniforms.hexTilingPatchScale.value = params.patchScale;
    }
  };
};
