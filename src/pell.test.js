/* eslint-disable */
"use strict";
const { init } = require("./pell");

jest.mock("./pell");

test("Should render a submit button to the action bar", () => {
  document.body.innerHTML = '<div id="editor"></div>';

  init({ element: document.getElementById("editor") });

  expect(init).toBeCalled();
  //wait for the dom update.
  setTimeout(() => {
    expect(document.querySelector("pell-submit-container")).toBeTruthy();
    expect(document.querySelector("pell-submit-button")).toBeTruthy();
  }, 0);
});
