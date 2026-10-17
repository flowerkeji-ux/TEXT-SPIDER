
const searchButton = document.getElementById('Search-Button');
const searchInput = document.getElementById('Search-Input');
const result_box = document.getElementById('result');

function highlightWord(word) {

  document.querySelectorAll("mark.wf-highlight").forEach((mark) => {
    const parent = mark.parentNode;
    parent.replaceChild(document.createTextNode(mark.textContent), mark);
    parent.normalize();
  });

  if (!word) return 0;   // stop if nothing
  const excaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`\\b(${excaped})\\b`, 'gi');

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
  acceptNode: (node) => {
    const tag = node.parentNode.nodeName;
    if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(tag)) {
      return NodeFilter.FILTER_REJECT;
    }
    return NodeFilter.FILTER_ACCEPT;
  },
});

const textNodes = [];
while (walker.nextNode())  textNodes.push(walker.currentNode);

// do the highlighting
let count = 0;
let firstMark = null;

textNodes.forEach((node) => {
  const parts = node.textContent.split(matcher);
  if (parts.length > 1) {

    const fragment = document.createDocumentFragment();
    parts.forEach((part, index) => {
      if (index % 2 === 1) {
        const mark = document.createElement("mark");
       mark.className = "wf-highlight";
        mark.style.background = "#ffe600";
        mark.style.color = "#000";
        mark.textContent = part;
        fragment.appendChild(mark);
        if (!firstMark) firstMark = mark;
        count++;
      } else if (part) {
        fragment.appendChild(document.createTextNode(part));
      }
    });

    node.parentNode.replaceChild(fragment, node);
  }
  });



  if (firstMark) {
    firstMark.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return count;
  
  }
   
  async function runSearch() {
    const word = searchInput.value.trim();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
      const answ = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: highlightWord,
        args: [word],
      });
      const count = answ[0].result;
      if (!word) result_box.textContent = "no search cleared highlights";
      else if (count === 0) result_box.textContent = "Can't find word :/";
      else result_box.textContent = count + (count === 1 ? " match" : " matches") + " found";
    }
    catch (error) {
      console.error("Error executing script:", error);
      result_box.textContent = "Error couldnt complete search.";
    }
     // (code alt)resultElement.textContent = `Found ${count} occurrence${count !== 1 ? 's' : ''}.`
}


searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
searchButton.addEventListener("click", runSearch);