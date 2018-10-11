/* eslint-disable */
"use strict";
const defaultParagraphSeparatorString = "defaultParagraphSeparator";
const formatBlock = "formatBlock";
const addEventListener = (parent, type, listener) =>
  parent.addEventListener(type, listener);
const appendChild = (parent, child) => parent.appendChild(child);
const createElement = tag => document.createElement(tag);
const createTextNode = text => document.createTextNode(text);
const queryCommandState = command => document.queryCommandState(command);
const queryCommandValue = command => document.queryCommandValue(command);

import debounce from "lodash.debounce";

export const exec = (command, value = null) =>
  document.execCommand(command, false, value);

const defaultActions = {
  bold: {
    icon: "<b>B</b>",
    title: "Bold",
    state: () => queryCommandState("bold"),
    result: () => exec("bold")
  },
  italic: {
    icon: "<i>I</i>",
    title: "Italic",
    state: () => queryCommandState("italic"),
    result: () => exec("italic")
  },
  underline: {
    icon: "<u>U</u>",
    title: "Underline",
    state: () => queryCommandState("underline"),
    result: () => exec("underline")
  },
  strikethrough: {
    icon: "<strike>S</strike>",
    title: "Strike-through",
    state: () => queryCommandState("strikeThrough"),
    result: () => exec("strikeThrough")
  },
  heading1: {
    icon: "<b>H<sub>1</sub></b>",
    title: "Heading 1",
    result: () => exec(formatBlock, "<h1>")
  },
  heading2: {
    icon: "<b>H<sub>2</sub></b>",
    title: "Heading 2",
    result: () => exec(formatBlock, "<h2>")
  },
  paragraph: {
    icon: "&#182;",
    title: "Paragraph",
    result: () => exec(formatBlock, "<p>")
  },
  quote: {
    icon: "&#8220; &#8221;",
    title: "Quote",
    result: () => exec(formatBlock, "<blockquote>")
  },
  olist: {
    icon: "&#35;",
    title: "Ordered List",
    result: () => exec("insertOrderedList")
  },
  ulist: {
    icon: "&#8226;",
    title: "Unordered List",
    result: () => exec("insertUnorderedList")
  },
  code: {
    icon: "&lt;/&gt;",
    title: "Code",
    result: () => exec(formatBlock, "<pre>")
  },
  line: {
    icon: "&#8213;",
    title: "Horizontal Line",
    result: () => exec("insertHorizontalRule")
  },
  link: {
    icon: "&#128279;",
    title: "Link",
    result: () => {
      const url = window.prompt("Enter the link URL");
      if (url) exec("createLink", url);
    }
  },
  image: {
    icon: "&#128247;",
    title: "Image",
    result: () => {
      const url = window.prompt("Enter the image URL");
      if (url) exec("insertImage", url);
    }
  }
};

const defaultClasses = {
  actionbar: "pell-actionbar",
  button: "pell-button",
  content: "pell-content",
  selected: "pell-button-selected",
  submitContainer: "pell-submit-container",
  submitButton: "pell-submit-button"
};

let isDisabled = true;

function toggleButton(val) {
  //strip the html and spaces, we're only interested in alphanumeric characters.
  const pattern = /<([^>]+)>/gi;
  const text = val
    .replace(pattern, "")
    .replace(/\s/g, "")
    .trim();
  isDisabled = text.length === 0 || !val;
}

export const init = settings => {
  const actions = settings.actions
    ? settings.actions.map(action => {
        if (typeof action === "string") return defaultActions[action];
        else if (defaultActions[action.name])
          return { ...defaultActions[action.name], ...action };
        return action;
      })
    : Object.keys(defaultActions).map(action => defaultActions[action]);

  const classes = { ...defaultClasses, ...settings.classes };

  const hasSubmitButton =
    typeof settings.hasSubmitButton === undefined
      ? false
      : settings.hasSubmitButton;

  const defaultParagraphSeparator =
    settings[defaultParagraphSeparatorString] || "div";

  const actionbar = createElement("div");
  actionbar.className = classes.actionbar;
  appendChild(settings.element, actionbar);

  const content = (settings.element.content = createElement("div"));
  content.contentEditable = true;
  content.className = classes.content;
  content.oninput = ({ target: { firstChild } }) => {
    if (firstChild && firstChild.nodeType === 3) {
      exec(formatBlock, `<${defaultParagraphSeparator}>`);
    } else if (content.innerHTML === "<br>") content.innerHTML = "";
    settings.onChange(content.innerHTML);
    if (hasSubmitButton) debounce(toggleButton(content.innerHTML), 500);
  };
  content.onkeydown = event => {
    if (event.key === "Tab") {
      event.preventDefault();
    } else if (
      event.key === "Enter" &&
      queryCommandValue(formatBlock) === "blockquote"
    ) {
      setTimeout(() => exec(formatBlock, `<${defaultParagraphSeparator}>`), 0);
    }
  };
  appendChild(settings.element, content);

  actions.forEach(action => {
    const button = createElement("button");
    button.className = classes.button;
    button.innerHTML = action.icon;
    button.title = action.title;
    button.setAttribute("type", "button");
    button.onclick = () => action.result() && content.focus();

    if (action.state) {
      const handler = () =>
        button.classList[action.state() ? "add" : "remove"](classes.selected);
      addEventListener(content, "keyup", handler);
      addEventListener(content, "mouseup", handler);
      addEventListener(button, "click", handler);
    }

    appendChild(actionbar, button);
  });

  if (hasSubmitButton) {
    const submitContainer = createElement("span");
    const submitButton = createElement("button");
    const text = settings.buttonText || "SUBMIT";
    const buttonText = createTextNode(text);
    submitContainer.className = classes.submitContainer;
    submitButton.className = classes.submitButton;
    submitButton.setAttribute("disabled", isDisabled);
    appendChild(actionbar, submitContainer);
    appendChild(submitContainer, submitButton);
    appendChild(submitButton, buttonText);

    const event = new Event("comment", {
      bubbles: true,
      cancelable: true
    });

    submitButton.onclick = () => submitButton.dispatchEvent(event);
  }

  if (settings.styleWithCSS) exec("styleWithCSS");
  exec(defaultParagraphSeparatorString, defaultParagraphSeparator);

  return settings.element;
};

export default { init, exec, toggleDisable };
