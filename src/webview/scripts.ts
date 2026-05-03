export function getScripts(): string {
  return `
    const vscode = acquireVsCodeApi();

    // ── TOC toggle ──
    const toc = document.getElementById('toc');
    const tocToggle = document.getElementById('tocToggle');
    tocToggle.addEventListener('click', () => {
      toc.classList.toggle('collapsed');
      const isCollapsed = toc.classList.contains('collapsed');
      tocToggle.textContent = isCollapsed ? '▶' : '◀';
      tocToggle.title = isCollapsed ? 'TOC 열기' : 'TOC 접기';
    });

    // ── TOC resize drag ──
    const resizeHandle = document.getElementById('tocResizeHandle');
    let isResizing = false;
    resizeHandle.addEventListener('mousedown', (e) => {
      if (toc.classList.contains('collapsed')) return;
      isResizing = true;
      resizeHandle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(120, Math.min(e.clientX, 500));
      toc.style.width = newWidth + 'px';
      toc.style.transition = 'none';
    });
    document.addEventListener('mouseup', () => {
      if (!isResizing) return;
      isResizing = false;
      resizeHandle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      toc.style.transition = '';
    });

    // ── TOC search ──
    const tocSearch = document.getElementById('tocSearch');
    let tocItemsArr = Array.from(document.querySelectorAll('.toc-item'));

    // Pre-compute: read data attributes once
    let tocData = tocItemsArr.map(item => ({
      level: parseInt(item.getAttribute('data-level') || '99'),
      text: item.getAttribute('data-text') || '',
      origHtml: item.innerHTML
    }));

    // Pre-compute parent index for each item
    let tocParentIdx = tocData.map((_, i) => {
      for (let j = i - 1; j >= 0; j--) {
        if (tocData[j].level < tocData[i].level) return j;
      }
      return -1;
    });

    tocSearch.addEventListener('input', () => {
      const query = tocSearch.value.trim().toLowerCase();

      if (!query) {
        tocItemsArr.forEach((item, i) => {
          item.style.display = '';
          item.style.opacity = '';
          item.innerHTML = tocData[i].origHtml;
        });
        return;
      }

      // First pass: direct match check
      const matched = tocData.map(d => d.text.toLowerCase().includes(query));

      // Ancestor match check
      function hasMatchedAncestor(i) {
        var p = tocParentIdx[i];
        while (p !== -1) {
          if (matched[p]) return true;
          p = tocParentIdx[p];
        }
        return false;
      }

      // Second pass: show/hide
      tocItemsArr.forEach((item, i) => {
        var text = tocData[i].text;

        if (matched[i]) {
          // Direct match: show with highlight
          var lower = text.toLowerCase();
          var idx = lower.indexOf(query);
          var highlighted = text.substring(0, idx) + '<span class="toc-highlight">' + text.substring(idx, idx + query.length) + '</span>' + text.substring(idx + query.length);
          item.innerHTML = highlighted;
          item.style.display = '';
          item.style.opacity = '';
        } else if (hasMatchedAncestor(i)) {
          // Child of match: show dimmed
          item.innerHTML = text;
          item.style.display = '';
          item.style.opacity = '0.45';
        } else {
          // No match: hide
          item.innerHTML = text;
          item.style.display = 'none';
          item.style.opacity = '';
        }
      });
    });

    // ── Font size control ──
    const savedState = vscode.getState() || { fontSize: 12 };
    let fontSize = savedState.fontSize;
    document.body.style.fontSize = fontSize + 'px';
    document.getElementById('fontSizeLabel').textContent = fontSize + 'px';

    document.getElementById('fontMinus').addEventListener('click', () => {
      fontSize = Math.max(10, fontSize - 1);
      document.body.style.fontSize = fontSize + 'px';
      document.getElementById('fontSizeLabel').textContent = fontSize + 'px';
      vscode.setState({ fontSize });
    });

    document.getElementById('fontPlus').addEventListener('click', () => {
      fontSize = Math.min(20, fontSize + 1);
      document.body.style.fontSize = fontSize + 'px';
      document.getElementById('fontSizeLabel').textContent = fontSize + 'px';
      vscode.setState({ fontSize });
    });

    // ── Active tracking ──
    function setActiveTocItem(id) {
      document.querySelectorAll('.toc-item').forEach(l => l.classList.remove('active'));
      const link = document.querySelector('.toc-item[href="#' + id + '"]');
      if (link) link.classList.add('active');
    }

    // ── Scroll sync ──
    let headingData = JSON.parse(document.getElementById('heading-data').textContent);
    let presentationActive = false;
    let scrollSource = null; // 'editor' or 'preview' — prevents infinite loop
    let scrollSourceTimer = null;

    function setScrollSource(source) {
      scrollSource = source;
      if (scrollSourceTimer) clearTimeout(scrollSourceTimer);
      scrollSourceTimer = setTimeout(() => { scrollSource = null; }, 300);
    }

    // Editor → Preview
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'syncScroll') {
        if (presentationActive || scrollSource === 'preview') return;
        setScrollSource('editor');
        const line = message.line;
        let targetId = null;
        for (let i = headingData.length - 1; i >= 0; i--) {
          if (headingData[i].line <= line) {
            targetId = headingData[i].id;
            break;
          }
        }
        if (targetId) {
          const target = document.getElementById(targetId);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      } else if (message.type === 'updateContent') {
        const contentEl = document.querySelector('.content');
        const savedScrollTop = contentEl.scrollTop;

        // Exit presentation mode if active
        if (presentationActive) exitPresentation();

        // Reset inline editing state
        inlineEditing = false;

        // Update content HTML
        contentEl.innerHTML = message.renderedHtml;

        // Update TOC items
        document.querySelector('.toc-items').innerHTML = message.tocHtml;

        // Update data elements
        document.getElementById('heading-data').textContent = JSON.stringify(message.headingData);
        document.getElementById('raw-markdown').textContent = JSON.stringify(message.rawMarkdown);

        // Update JS references
        headingData = message.headingData;
        headingEls = contentEl.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');

        // Re-run syntax highlighting
        contentEl.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));

        // Re-add code copy buttons
        contentEl.querySelectorAll('pre').forEach(pre => {
          const code = pre.querySelector('code');
          if (!code) return;
          const btn = document.createElement('button');
          btn.className = 'code-copy-btn';
          btn.textContent = 'Copy';
          btn.addEventListener('click', () => {
            navigator.clipboard.writeText(code.textContent || '').then(() => {
              btn.textContent = 'Copied!';
              btn.classList.add('copied');
              setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
            });
          });
          pre.appendChild(btn);
        });

        // Rebuild slides for presentation mode (must happen before mermaid init)
        totalSlides = buildSlides();
        allSlides = document.querySelectorAll('.slide');
        if (totalSlides <= 1) presentBtn.style.opacity = '0.3';
        else presentBtn.style.opacity = '';

        // Re-initialize mermaid diagrams (after slides are built so DOM is stable)
        const mermaidDivs = contentEl.querySelectorAll('.mermaid');
        if (mermaidDivs.length > 0) {
          const nodes = Array.from(mermaidDivs);
          // Remove any stale processed state so mermaid re-renders them
          nodes.forEach(el => el.removeAttribute('data-processed'));
          if (typeof mermaid.run === 'function') {
            mermaid.run({ nodes }).catch(() => {});
          } else {
            try { mermaid.init(undefined, nodes); } catch(e) {}
          }
          setTimeout(fixMermaidDiagrams, 500);
          setTimeout(fixMermaidDiagrams, 1500);
          setTimeout(setupMermaidZoom, 600);
          setTimeout(setupMermaidZoom, 1600);
        }

        // Re-build TOC data for search
        tocItemsArr = Array.from(document.querySelectorAll('.toc-item'));
        tocData = tocItemsArr.map(item => ({
          level: parseInt(item.getAttribute('data-level') || '99'),
          text: item.getAttribute('data-text') || '',
          origHtml: item.innerHTML
        }));
        tocParentIdx = tocData.map((_, i) => {
          for (let j = i - 1; j >= 0; j--) {
            if (tocData[j].level < tocData[i].level) return j;
          }
          return -1;
        });

        // Re-attach TOC click handlers
        tocItemsArr.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const id = link.getAttribute('href').substring(1);
            const tgt = document.getElementById(id);
            if (tgt) {
              setScrollSource('preview');
              tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            setActiveTocItem(id);
            const heading = headingData.find(h => h.id === id);
            if (heading) {
              vscode.postMessage({ type: 'scrollToLine', line: heading.line });
            }
          });
        });

        // Re-apply TOC search if active
        if (tocSearch.value.trim()) {
          tocSearch.dispatchEvent(new Event('input'));
        }

        // Restore scroll position (disable smooth scroll temporarily)
        contentEl.style.scrollBehavior = 'auto';
        contentEl.scrollTop = savedScrollTop;
        requestAnimationFrame(() => { contentEl.style.scrollBehavior = ''; });
      }
    });

    // ── TOC click ──
    document.querySelectorAll('.toc-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('href').substring(1);
        const target = document.getElementById(id);
        if (target) {
          setScrollSource('preview');
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setActiveTocItem(id);
        // Send exact heading line to editor
        const heading = headingData.find(h => h.id === id);
        if (heading) {
          vscode.postMessage({ type: 'scrollToLine', line: heading.line });
        }
      });
    });

    // ── Scroll-based active section ──
    const content = document.querySelector('.content');
    let headingEls = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');

    let previewScrollTimeout = null;
    content.addEventListener('scroll', () => {
      let current = '';
      headingEls.forEach(heading => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 80) {
          current = heading.id;
        }
      });
      setActiveTocItem(current);

      // Preview → Editor sync using current active heading
      if (scrollSource === 'editor') return;
      if (previewScrollTimeout) clearTimeout(previewScrollTimeout);
      previewScrollTimeout = setTimeout(() => {
        setScrollSource('preview');
        // Use the current active heading from headingData for accurate sync
        if (current) {
          const heading = headingData.find(h => h.id === current);
          if (heading) {
            vscode.postMessage({ type: 'scrollToLine', line: heading.line });
            return;
          }
        }
        // Fallback: find topmost visible element with data-line-start
        const els = content.querySelectorAll('[data-line-start]');
        let bestEl = null;
        for (const el of els) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100) {
            bestEl = el;
          } else {
            break;
          }
        }
        if (bestEl) {
          const line = parseInt(bestEl.dataset.lineStart);
          vscode.postMessage({ type: 'scrollToLine', line: line });
        }
      }, 150);
    });

    // ── Syntax highlighting ──
    document.querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });

    // ── Code copy buttons ──
    document.querySelectorAll('pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (!code) return;
      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        const text = code.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
      pre.appendChild(btn);
    });

    // ── Fix mermaid visibility after render ──
    function detectMermaidType(svg) {
      // Detect by internal elements since aria-roledescription may vary
      if (svg.querySelector('.grid .tick, .section')) return 'gantt';
      if (svg.querySelector('.actor, .messageLine0')) return 'sequence';
      if (svg.querySelector('.er.entityBox, .er.relationshipLine')) return 'er';
      if (svg.querySelector('.gitGraph')) return 'git';
      if (svg.querySelector('.journey-section')) return 'journey';
      // Compact types
      if (svg.querySelector('.flowchart-link, .edgePath')) return 'flowchart';
      if (svg.querySelector('.classGroup, path.relation')) return 'class';
      if (svg.querySelector('.statediagram-state')) return 'state';
      if (svg.querySelector('.pieCircle')) return 'pie';
      // Fallback: also check aria-roledescription
      return svg.getAttribute('aria-roledescription') || 'unknown';
    }

    function fixMermaidDiagrams() {
      const isLightMode = document.body.classList.contains('vscode-light');
      const lineColor = isLightMode ? '#475569' : '#58a6ff';
      const textColor = isLightMode ? '#1e293b' : '#e2e8f0';
      const subTextColor = isLightMode ? '#334155' : '#cbd5e1';
      const wideTypes = ['gantt', 'sequence', 'er', 'journey', 'timeline', 'git'];

      document.querySelectorAll('.mermaid svg').forEach(svg => {
        const type = detectMermaidType(svg);
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
        if (wideTypes.includes(type)) {
          // Wide diagrams → full width
          svg.style.width = '100%';
        } else {
          // Compact diagrams → constrain to 700px, centered
          svg.setAttribute('width', '700');
          svg.removeAttribute('height');
          svg.style.maxWidth = '100%';
        }

        // Fix all marker arrowheads (path, circle, polygon — every child of marker)
        svg.querySelectorAll('marker path, marker circle, marker polygon, marker line, [id*="arrowhead"] path, [id*="crosshead"] path, [id*="arrow"] path').forEach(p => {
          p.setAttribute('fill', lineColor);
          p.setAttribute('stroke', lineColor);
        });
        // Fix relation lines (class diagram, ER, etc.)
        svg.querySelectorAll('path.relation, path[class*="transition"], .er.relationshipLine path').forEach(p => {
          p.setAttribute('stroke', lineColor);
          p.setAttribute('stroke-width', '2');
        });
        // Fix flowchart/edge paths
        svg.querySelectorAll('.edgePath path, path.flowchart-link').forEach(p => {
          p.setAttribute('stroke', lineColor);
          p.setAttribute('stroke-width', '2');
        });
        // Fix all generic lines
        svg.querySelectorAll('line').forEach(l => {
          const cls = l.getAttribute('class') || '';
          if (!cls.includes('divider')) {
            l.setAttribute('stroke', lineColor);
          }
        });

        // Sequence diagram: fix actor text & boxes
        svg.querySelectorAll('text.actor-box, .actor text, text[class*="actor"]').forEach(t => {
          t.setAttribute('fill', textColor);
        });
        svg.querySelectorAll('rect.actor').forEach(r => {
          if (!isLightMode) {
            r.setAttribute('fill', '#1e3a5f');
            r.setAttribute('stroke', '#60a5fa');
          }
        });

        // Gantt: fix text colors
        svg.querySelectorAll('.sectionTitle, .sectionTitle0, .sectionTitle1, .sectionTitle2, .sectionTitle3').forEach(t => {
          t.setAttribute('fill', textColor);
        });
        svg.querySelectorAll('.taskText, .taskTextOutsideRight, .taskTextOutsideLeft').forEach(t => {
          t.setAttribute('fill', textColor);
        });
        svg.querySelectorAll('.titleText').forEach(t => {
          t.setAttribute('fill', textColor);
        });
        svg.querySelectorAll('.tick text').forEach(t => {
          t.setAttribute('fill', subTextColor);
        });

        // Universal: fix invisible text (dark-on-dark or light-on-light)
        svg.querySelectorAll('text').forEach(t => {
          const fill = t.getAttribute('fill');
          if (!fill) return;
          if (!isLightMode && (fill === '#000' || fill === '#000000' || fill === 'black' || fill === 'rgb(0, 0, 0)')) {
            t.setAttribute('fill', textColor);
          }
          if (isLightMode && (fill === '#fff' || fill === '#ffffff' || fill === 'white' || fill === 'rgb(255, 255, 255)' || fill === '#ccc' || fill === '#d4d4d4' || fill === '#e2e8f0' || fill === '#f1f5f9')) {
            t.setAttribute('fill', textColor);
          }
        });
      });
    }
    // Run after mermaid renders (slight delay needed)
    setTimeout(fixMermaidDiagrams, 500);
    setTimeout(fixMermaidDiagrams, 1500);
    setTimeout(fixMermaidDiagrams, 3000);

    // ══════════════════════════════════════════
    // ── MERMAID ZOOM / PAN ──
    // ══════════════════════════════════════════
    function setupMermaidZoom() {
      document.querySelectorAll('.mermaid').forEach(el => {
        if (el.dataset.zoomSetup) return;
        el.dataset.zoomSetup = 'true';

        const controls = document.createElement('div');
        controls.className = 'mermaid-zoom-controls';
        controls.innerHTML =
          '<button class="mermaid-zoom-btn" data-action="in" title="확대">+</button>' +
          '<button class="mermaid-zoom-btn" data-action="out" title="축소">−</button>' +
          '<button class="mermaid-zoom-btn" data-action="reset" title="초기화">↺</button>';
        el.appendChild(controls);

        let scale = 1, tx = 0, ty = 0;
        let panning = false, sx = 0, sy = 0;

        function apply() {
          const svg = el.querySelector('svg');
          if (!svg) return;
          svg.style.transform = 'scale(' + scale + ') translate(' + tx + 'px,' + ty + 'px)';
          svg.style.transformOrigin = 'center center';
          const zoomed = scale > 1;
          el.classList.toggle('zoomed', zoomed);
          svg.style.pointerEvents = zoomed ? 'none' : '';
        }

        controls.addEventListener('click', function(e) {
          const btn = e.target.closest('.mermaid-zoom-btn');
          if (!btn) return;
          e.stopPropagation();
          e.preventDefault();
          const action = btn.dataset.action;
          if (action === 'in') {
            scale = Math.min(scale + 0.25, 4);
          } else if (action === 'out') {
            scale = Math.max(scale - 0.25, 0.5);
            if (scale <= 1) { tx = 0; ty = 0; }
          } else if (action === 'reset') {
            scale = 1; tx = 0; ty = 0;
          }
          apply();
        });

        el.addEventListener('mousedown', function(e) {
          if (scale <= 1) return;
          if (e.target.closest('.mermaid-zoom-controls')) return;
          panning = true;
          sx = e.clientX; sy = e.clientY;
          el.classList.add('panning');
          e.preventDefault();
        });

        document.addEventListener('mousemove', function(e) {
          if (!panning) return;
          tx += (e.clientX - sx) / scale;
          ty += (e.clientY - sy) / scale;
          sx = e.clientX; sy = e.clientY;
          apply();
        });

        document.addEventListener('mouseup', function() {
          if (panning) { panning = false; el.classList.remove('panning'); }
        });

        el.addEventListener('wheel', function(e) {
          if (!e.ctrlKey && !e.metaKey) return;
          e.preventDefault();
          const delta = e.deltaY > 0 ? -0.15 : 0.15;
          scale = Math.min(Math.max(scale + delta, 0.5), 4);
          if (scale <= 1) { tx = 0; ty = 0; }
          apply();
        }, { passive: false });
      });
    }
    setTimeout(setupMermaidZoom, 600);
    setTimeout(setupMermaidZoom, 1600);

    // ══════════════════════════════════════════
    // ── INLINE EDIT (double-click) ──
    // ══════════════════════════════════════════
    let inlineEditing = false;

    document.querySelector('.content').addEventListener('dblclick', (e) => {
      if (inlineEditing || presentationActive) return;

      // Find the nearest block element with line data
      let target = e.target;
      while (target && target !== document.body) {
        if (target.dataset && target.dataset.lineStart !== undefined) break;
        target = target.parentElement;
      }
      if (!target || target === document.body) return;

      const lineStart = parseInt(target.dataset.lineStart);
      const lineEnd = parseInt(target.dataset.lineEnd);
      const rawMarkdown = JSON.parse(document.getElementById('raw-markdown').textContent);
      const sourceLines = rawMarkdown.split('\\\\n').slice(lineStart, lineEnd);
      const sourceText = sourceLines.join('\\\\n');

      inlineEditing = true;
      vscode.postMessage({ type: 'editModeChanged', active: true });

      // Create inline editor
      const editorEl = document.createElement('div');
      editorEl.className = 'inline-editor';

      const ta = document.createElement('textarea');
      ta.className = 'inline-edit-textarea';
      ta.value = sourceText;
      ta.spellcheck = false;

      const bar = document.createElement('div');
      bar.className = 'inline-edit-toolbar';
      bar.innerHTML = '<span class="inline-edit-hint">Ctrl+Enter Save \\\\u00B7 Esc Cancel</span><button class="inline-edit-save">Save</button><button class="inline-edit-cancel">Cancel</button>';

      editorEl.appendChild(ta);
      editorEl.appendChild(bar);

      target.style.display = 'none';
      target.after(editorEl);
      ta.focus();

      // Auto-resize
      ta.style.height = Math.max(ta.scrollHeight, 60) + 'px';
      ta.addEventListener('input', () => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      });

      function save() {
        vscode.postMessage({ type: 'inlineEditSave', lineStart, lineEnd, text: ta.value });
        inlineEditing = false;
        vscode.postMessage({ type: 'editModeChanged', active: false });
        editorEl.remove();
      }

      function cancel() {
        target.style.display = '';
        editorEl.remove();
        inlineEditing = false;
        vscode.postMessage({ type: 'editModeChanged', active: false });
      }

      bar.querySelector('.inline-edit-save').addEventListener('click', save);
      bar.querySelector('.inline-edit-cancel').addEventListener('click', cancel);

      ta.addEventListener('keydown', (ev) => {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); save(); }
        if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
        if (ev.key === 'Tab') {
          ev.preventDefault();
          const s = ta.selectionStart, end = ta.selectionEnd;
          ta.value = ta.value.substring(0, s) + '  ' + ta.value.substring(end);
          ta.selectionStart = ta.selectionEnd = s + 2;
        }
      });
    });

    // ══════════════════════════════════════════
    // ── EDIT MODE (full) ──
    // ══════════════════════════════════════════
    const editBtn = document.getElementById('editBtn');
    const editTextarea = document.getElementById('editTextarea');
    let editMode = false;

    function enterEditMode() {
      if (presentationActive) return;
      const rawMarkdown = JSON.parse(document.getElementById('raw-markdown').textContent);
      editTextarea.value = rawMarkdown;
      editMode = true;
      document.body.classList.add('edit-mode');
      editBtn.style.color = '#6CB6FF';
      editTextarea.focus();
      vscode.postMessage({ type: 'editModeChanged', active: true });
    }

    function exitEditMode() {
      editMode = false;
      document.body.classList.remove('edit-mode');
      editBtn.style.color = '';
      vscode.postMessage({ type: 'editModeChanged', active: false });
    }

    function saveEdit() {
      vscode.postMessage({ type: 'editSave', text: editTextarea.value });
      exitEditMode();
    }

    editBtn.addEventListener('click', () => {
      if (editMode) {
        const hasChanges = editTextarea.value !== JSON.parse(document.getElementById('raw-markdown').textContent);
        if (hasChanges) {
          if (confirm('Discard unsaved changes?')) {
            exitEditMode();
          }
        } else {
          exitEditMode();
        }
      } else {
        enterEditMode();
      }
    });

    editTextarea.addEventListener('keydown', (e) => {
      // Ctrl+S / Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveEdit();
      }
      // Escape to exit
      if (e.key === 'Escape') {
        e.preventDefault();
        const hasChanges = editTextarea.value !== JSON.parse(document.getElementById('raw-markdown').textContent);
        if (hasChanges) {
          if (confirm('Discard unsaved changes?')) {
            exitEditMode();
          }
        } else {
          exitEditMode();
        }
      }
      // Tab to indent
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editTextarea.selectionStart;
        const end = editTextarea.selectionEnd;
        editTextarea.value = editTextarea.value.substring(0, start) + '  ' + editTextarea.value.substring(end);
        editTextarea.selectionStart = editTextarea.selectionEnd = start + 2;
      }
    });

    // ══════════════════════════════════════════
    // ── PRESENTATION MODE ──
    // ══════════════════════════════════════════
    function buildSlides() {
      const contentEl = document.querySelector('.content');
      const children = Array.from(contentEl.childNodes);
      const groups = [];
      let cur = [];

      children.forEach(node => {
        if (node.nodeName === 'HR') {
          groups.push(cur);
          cur = [];
          node.classList.add('slide-divider');
        } else {
          cur.push(node);
        }
      });
      if (cur.length > 0) groups.push(cur);

      groups.forEach((group, i) => {
        const div = document.createElement('div');
        div.className = 'slide';
        div.dataset.slideIndex = i;
        if (group.length > 0) {
          contentEl.insertBefore(div, group[0]);
          group.forEach(n => div.appendChild(n));
        }
      });

      contentEl.querySelectorAll('.slide-divider').forEach(hr => hr.remove());
      return groups.length;
    }

    let totalSlides = buildSlides();
    let currentSlide = 0;
    let allSlides = document.querySelectorAll('.slide');
    const slideCounter = document.getElementById('slideCounter');
    const presentBtn = document.getElementById('presentBtn');

    function updateSlideClasses() {
      allSlides.forEach((s, i) => {
        s.classList.remove('slide-active', 'slide-prev');
        if (i === currentSlide) s.classList.add('slide-active');
        else if (i < currentSlide) s.classList.add('slide-prev');
      });
      slideCounter.textContent = (currentSlide + 1) + ' / ' + totalSlides;
    }

    function enterPresentation() {
      if (totalSlides <= 1 || editMode) return;
      presentationActive = true;
      currentSlide = 0;
      document.body.classList.add('presentation-mode');
      updateSlideClasses();
      try {
        const nodes = Array.from(document.querySelectorAll('.slide-active .mermaid'));
        if (nodes.length > 0) {
          nodes.forEach(el => el.removeAttribute('data-processed'));
          if (typeof mermaid.run === 'function') mermaid.run({ nodes }).catch(() => {});
          else mermaid.init(undefined, nodes);
        }
      } catch(e) {}
    }

    function exitPresentation() {
      presentationActive = false;
      document.body.classList.remove('presentation-mode');
      allSlides.forEach(s => s.classList.remove('slide-active', 'slide-prev'));
    }

    function goToSlide(index) {
      if (index < 0 || index >= totalSlides) return;
      currentSlide = index;
      updateSlideClasses();
      try {
        const nodes = Array.from(document.querySelectorAll('.slide-active .mermaid'));
        if (nodes.length > 0) {
          nodes.forEach(el => el.removeAttribute('data-processed'));
          if (typeof mermaid.run === 'function') mermaid.run({ nodes }).catch(() => {});
          else mermaid.init(undefined, nodes);
        }
      } catch(e) {}
    }

    presentBtn.addEventListener('click', () => {
      presentationActive ? exitPresentation() : enterPresentation();
    });

    document.getElementById('slidePrev').addEventListener('click', () => goToSlide(currentSlide - 1));
    document.getElementById('slideNext').addEventListener('click', () => goToSlide(currentSlide + 1));
    document.getElementById('slideExit').addEventListener('click', exitPresentation);

    document.addEventListener('keydown', (e) => {
      if (!presentationActive) return;
      switch(e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ':
          e.preventDefault(); goToSlide(currentSlide + 1); break;
        case 'ArrowLeft': case 'ArrowUp':
          e.preventDefault(); goToSlide(currentSlide - 1); break;
        case 'Escape': exitPresentation(); break;
        case 'Home': e.preventDefault(); goToSlide(0); break;
        case 'End': e.preventDefault(); goToSlide(totalSlides - 1); break;
      }
    });

    // Hide present button if no slides
    if (totalSlides <= 1) presentBtn.style.opacity = '0.3';

    // ══════════════════════════════════════════
    // ── PDF EXPORT ──
    // ══════════════════════════════════════════
    const pdfBtn = document.getElementById('pdfBtn');
    let pdfExporting = false;

    pdfBtn.addEventListener('click', () => {
      if (pdfExporting) return;
      pdfExporting = true;
      pdfBtn.textContent = '...';
      pdfBtn.style.opacity = '0.5';
      vscode.postMessage({ type: 'exportPdf' });
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'pdfStatus') {
        pdfExporting = false;
        pdfBtn.textContent = 'PDF';
        pdfBtn.style.opacity = '1';
      }
    });
  `;
}
