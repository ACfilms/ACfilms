(function(){
  'use strict';

  var btn=document.querySelector('.nav-toggle'), nav=document.getElementById('site-nav');
  if(!btn||!nav) return;
  var header=document.querySelector('.site-header');
  var root=document.documentElement;
  var motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
  var progressBar=document.querySelector('.scroll-progress-bar');
  var processSection=document.getElementById('process');
  var processSteps=processSection?[].slice.call(processSection.querySelectorAll('.process-step')):[];
  var reduceMotion=motionQuery.matches;
  var timelineRevealed=false;
  var links=[].slice.call(nav.querySelectorAll('a[href^="#"]:not(.btn)'));
  var sections=[], map={}, currentId='', headerOffset=88;
  var scrollFrame=0, updateFrame=0, navigating=false;
  var navigationDestination=null, arrivalPlayed=false, allowHeadingReplay=false;
  var indicatorDirty=true, handoffAnimations=[], handoffSerial=0;
  var indicator=document.createElement('span');
  indicator.className='nav-indicator';
  indicator.setAttribute('aria-hidden','true');
  nav.appendChild(indicator);
  nav.classList.add('has-indicator');
  var navAccent=document.createElement('span');
  navAccent.className='nav-accent-sweep';
  navAccent.setAttribute('aria-hidden','true');
  var navHandoff=document.createElement('span');
  navHandoff.className='nav-handoff';
  navHandoff.setAttribute('aria-hidden','true');
  if(header){header.appendChild(navHandoff);header.appendChild(navAccent);}

  links.forEach(function(link){
    var section=document.getElementById(link.getAttribute('href').slice(1));
    if(section){sections.push(section);map[section.id]=link;}
  });

  function setOpen(open,restoreFocus){
    var wasOpen=nav.classList.contains('is-open');
    nav.classList.toggle('is-open',open);
    btn.setAttribute('aria-expanded',open?'true':'false');
    btn.setAttribute('aria-label',open?'Close menu':'Open menu');
    if(wasOpen&&!open&&restoreFocus) btn.focus({preventScroll:true});
    indicatorDirty=true;
    queueNavigationUpdate();
  }

  function moveIndicator(){
    indicatorDirty=false;
    var link=map[currentId];
    if(!link||window.innerWidth<=900){indicator.classList.remove('is-positioned');return;}
    var area=nav.getBoundingClientRect(), bounds=link.getBoundingClientRect();
    indicator.style.transform='translate3d('+(bounds.left-area.left)+'px,'+(bounds.bottom-area.top-2)+'px,0) scaleX('+bounds.width+')';
    indicator.classList.add('is-positioned');
  }

  function setCurrent(id){
    if(id===currentId||!map[id]) return;
    currentId=id;
    links.forEach(function(link){
      if(link===map[id]) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    moveIndicator();
  }

  function updateHeaderOffset(){
    headerOffset=(header?Math.max(0,header.getBoundingClientRect().bottom):72)+16;
    root.style.setProperty('--nav-offset',headerOffset+'px');
    indicatorDirty=true;
    if(header){
      var area=nav.getBoundingClientRect(), bounds=header.getBoundingClientRect();
      header.style.setProperty('--accent-left',window.innerWidth>900?(area.left-bounds.left)+'px':'0px');
      header.style.setProperty('--accent-width',window.innerWidth>900?area.width+'px':'100%');
    }
  }

  // Gold scroll progress and the How We Work timeline share the existing
  // scroll frame, so no extra scroll listeners are registered.
  function clamp01(value){
    return value<0?0:value>1?1:value;
  }

  function updateScrollProgress(){
    if(!progressBar) return;
    var scrollable=root.scrollHeight-window.innerHeight;
    var progress=scrollable>0?clamp01(window.scrollY/scrollable):0;
    progressBar.style.transform='scaleX('+progress+')';
  }

  function updateTimelineProgress(){
    if(!processSteps.length||!processSection) return;
    if(reduceMotion){
      processSteps.forEach(function(step){
        step.classList.add('is-lit');
        step.style.setProperty('--segment-progress','1');
      });
      timelineRevealed=true;
      return;
    }
    var rect=processSection.getBoundingClientRect();
    if(rect.bottom<0||rect.top>window.innerHeight){
      // Fully offscreen: clear the drawn state so the timeline redraws the next
      // time it enters, in either scroll direction.
      if(timelineRevealed){
        timelineRevealed=false;
        processSteps.forEach(function(step){
          step.classList.remove('is-lit');
          step.style.setProperty('--segment-progress','0');
        });
      }
      return;
    }
    timelineRevealed=true;
    var progress=clamp01((window.innerHeight*0.7-rect.top)/(rect.height+window.innerHeight*0.5));
    processSteps.forEach(function(step,index){
      step.classList.toggle('is-lit',progress>=(index+0.8)/processSteps.length);
      var segment=clamp01(progress*processSteps.length-index-0.2);
      step.style.setProperty('--segment-progress',segment.toFixed(3));
    });
  }

  function updateNavigation(){
    updateFrame=0;
    var nextId=sections.length?sections[0].id:'';
    if(!navigating){
      // Six geometry reads also account for filters, tabs, and expanded FAQs.
      var line=headerOffset+(window.innerHeight-headerOffset)*0.25;
      sections.forEach(function(section){
        if(section.getBoundingClientRect().top<=line) nextId=section.id;
      });
      if(window.scrollY>0&&window.scrollY+window.innerHeight>=root.scrollHeight-2){
        nextId=sections[sections.length-1].id;
      }
    }
    if(header) header.classList.toggle('is-solid',window.scrollY>30);
    if(!navigating) setCurrent(nextId);
    if(indicatorDirty) moveIndicator();
    updateScrollProgress();
    updateTimelineProgress();
  }

  function queueNavigationUpdate(){
    if(!updateFrame) updateFrame=window.requestAnimationFrame(updateNavigation);
  }

  function cancelNavigation(){
    if(scrollFrame) window.cancelAnimationFrame(scrollFrame);
    scrollFrame=0;
    navigating=false;
    navigationDestination=null;
    root.classList.remove('is-navigating');
    stopHandoff();
    revealEligibleItems();
    queueNavigationUpdate();
  }

  function stopHandoff(){
    handoffSerial++;
    handoffAnimations.forEach(function(animation){animation.cancel();});
    handoffAnimations=[];
    if(header) header.classList.remove('is-transitioning');
  }

  function startHandoff(){
    if(!header||motionQuery.matches||typeof navAccent.animate!=='function') return;
    var serial=++handoffSerial;
    header.classList.add('is-transitioning');
    handoffAnimations.push(navAccent.animate([
      {opacity:0,transform:'scaleX(0.02)'},
      {offset:0.3,opacity:0.6,transform:'scaleX(0.55)'},
      {offset:0.75,opacity:0.35,transform:'scaleX(1)'},
      {opacity:0,transform:'scaleX(1)'}
    ],{duration:420,easing:'cubic-bezier(0.22, 1, 0.36, 1)'}));
    if(window.innerWidth>900){
      handoffAnimations.push(navHandoff.animate([
        {opacity:0,transform:'scaleX(0.94)'},
        {offset:0.35,opacity:0.45,transform:'scaleX(1)'},
        {opacity:0,transform:'scaleX(0.94)'}
      ],{duration:360,easing:'ease-in-out'}));
    }
    Promise.all(handoffAnimations.map(function(animation){return animation.finished.catch(function(){});})).then(function(){
      if(serial===handoffSerial){handoffAnimations=[];header.classList.remove('is-transitioning');}
    });
  }

  function coordinateArrival(){
    if(!navigationDestination||arrivalPlayed) return;
    var heading=navigationDestination.querySelector('h1, h2');
    if(!heading){arrivalPlayed=true;revealEligibleItems();return;}
    var bounds=heading.getBoundingClientRect();
    if(bounds.top>window.innerHeight*0.82||bounds.bottom<headerOffset) return;
    arrivalPlayed=true;
    if(allowHeadingReplay&&heading.classList.contains('is-visible')){
      heading.classList.remove('is-arriving');
      heading.classList.add('is-arriving');
    }
    revealEligibleItems();
  }

  function focusDestination(section){
    var destination=section.querySelector('h1, h2')||section;
    var hadTabindex=destination.hasAttribute('tabindex');
    if(!hadTabindex) destination.setAttribute('tabindex','-1');
    destination.focus({preventScroll:true});
    if(!hadTabindex){
      destination.addEventListener('blur',function(){destination.removeAttribute('tabindex');},{once:true});
    }
  }

  function navigateTo(section){
    cancelNavigation();
    updateHeaderOffset();
    setCurrent(section.id);
    var start=window.scrollY;
    var top=section.id==='top'?0:section.getBoundingClientRect().top+start-headerOffset;
    top=Math.max(0,Math.min(top,Math.max(0,root.scrollHeight-window.innerHeight)));
    var distance=top-start;
    var duration=650+Math.min(200,Math.abs(distance)/12);
    var started=performance.now();
    navigating=true;
    navigationDestination=section;
    arrivalPlayed=false;
    allowHeadingReplay=Math.abs(distance)>window.innerHeight*0.5;
    // Native CSS smooth scrolling must not compete with each animation frame.
    root.classList.add('is-navigating');
    startHandoff();
    coordinateArrival();

    function finish(){
      scrollFrame=0;
      arrivalPlayed=true;
      revealEligibleItems();
      focusDestination(section);
      navigating=false;
      navigationDestination=null;
      root.classList.remove('is-navigating');
      revealEligibleItems();
      queueNavigationUpdate();
    }

    if(motionQuery.matches||Math.abs(distance)<1){
      window.scrollTo(0,top);
      finish();
      return;
    }

    function step(now){
      var progress=Math.min(1,(now-started)/duration);
      var eased=progress*progress*progress*(progress*(progress*6-15)+10);
      var position=start+distance*eased;
      window.scrollTo(0,position);
      if(Math.abs(top-position)<window.innerHeight) coordinateArrival();
      if(progress<1) scrollFrame=window.requestAnimationFrame(step);
      else finish();
    }
    scrollFrame=window.requestAnimationFrame(step);
  }

  btn.addEventListener('click',function(event){
    var open=!nav.classList.contains('is-open');
    setOpen(open);
    if(open&&event.detail===0&&links.length) links[0].focus();
  });
  // One delegated handler covers the navbar, its booking link, and the logo.
  (header||nav).addEventListener('click',function(event){
    var link=event.target.closest('a[href^="#"]');
    if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey) return;
    var href=link.getAttribute('href');
    var section=document.getElementById(href.slice(1));
    if(!section) return;
    event.preventDefault();
    setOpen(false,true);
    if(window.location.hash!==href) window.history.pushState(null,'',href);
    navigateTo(section);
  });
  document.addEventListener('pointerdown',function(event){
    if(navigating) cancelNavigation();
    if(nav.classList.contains('is-open')&&!(header||nav).contains(event.target)) setOpen(false);
  });
  window.addEventListener('wheel',function(){if(navigating) cancelNavigation();},{passive:true});
  window.addEventListener('touchstart',function(){if(navigating) cancelNavigation();},{passive:true});
  document.addEventListener('keydown',function(event){
    if(event.key==='Escape'&&nav.classList.contains('is-open')){
      setOpen(false,true);
      event.preventDefault();
    }
    if(navigating&&['Escape','Tab','ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].indexOf(event.key)!==-1){
      cancelNavigation();
    }
  });
  window.addEventListener('scroll',queueNavigationUpdate,{passive:true});
  window.addEventListener('resize',function(){
    cancelNavigation();
    if(window.innerWidth>900) setOpen(false);
    updateHeaderOffset();
    queueNavigationUpdate();
  });
  window.addEventListener('popstate',function(){cancelNavigation();setOpen(false);});
  window.addEventListener('hashchange',queueNavigationUpdate);
  window.addEventListener('load',queueNavigationUpdate,{once:true});
  if('ResizeObserver' in window){
    var layoutObserver=new ResizeObserver(function(){updateHeaderOffset();queueNavigationUpdate();});
    if(header) layoutObserver.observe(header);
    layoutObserver.observe(nav);
    var main=document.querySelector('main');
    if(main) layoutObserver.observe(main);
  }
  updateHeaderOffset();
  updateNavigation();
  if(document.fonts&&document.fonts.ready){
    document.fonts.ready.then(function(){updateHeaderOffset();queueNavigationUpdate();});
  }

  // Text gets a gentle blur; video cards use independent translation, never blur.
  var revealTargets=[].slice.call(document.querySelectorAll(
    '.hero-text > .eyebrow, .hero-text > h1, .hero-text > .lead, .hero-text > .cta, '+
    'section.reveal .wrap > h2:not(.sr-only), section.reveal .wrap > .sub, '+
    '.showreel-heading, .portfolio-filters, .portfolio-block-title, .package-tabs, '+
    '.packages-cta, .custom-package-section > h3, .about-copy > .eyebrow, '+
    '.about-copy > h2, .about-description, .about-highlights, '+
    '.contact-intro > h2, .contact-intro > .sub, .contact-intro > .btn, '+
    '.contact-row, #faq .faq, #process .process-step, '+
    '#work .portfolio-card[data-video], #packages .package-card, .section-divider, '+
    '#photography .eyebrow, #photography .photography-card, '+
    '.closing-inner > .eyebrow, .closing-inner > .closing-brand, .closing-inner > h2, '+
    '.closing-inner > .closing-line, .closing-inner > .closing-divider, .closing-inner > .closing-cta'
  ));
  // Hero entrance choreography: headline now, description after 120ms, CTAs
  // after 220ms, matching the one-time opening sequence.
  var heroDelays=new Map();
  [['.hero-text > .eyebrow',0],['.hero-text > h1',0],['.hero-text > .lead',120],['.hero-text > .cta',220]]
    .forEach(function(pair){
      var item=revealTargets.filter(function(t){return t.matches(pair[0]);})[0];
      if(item) heroDelays.set(item,pair[1]);
    });
  var revealObserver=null;
  var eligibleReveals=new Set(), revealBatches=new Map();

  function showReveal(item,delay){
    item.style.setProperty('--reveal-delay',(delay||0)+'ms');
    item.classList.add('is-visible');
    eligibleReveals.delete(item);
    // The item stays observed so its reveal can replay when it re-enters the viewport.
  }

  function resetReveal(item){
    if(!item.classList.contains('is-visible')) return;
    item.classList.remove('is-visible','is-arriving');
    item.style.removeProperty('--reveal-delay');
    eligibleReveals.delete(item);
  }

  // An element is only reset once it is completely outside the viewport, so a
  // reveal never replays while the element is still partly visible.
  function isFullyOutOfView(entry){
    var rect=entry.boundingClientRect;
    return rect.bottom<=0||rect.top>=window.innerHeight;
  }

  function revealEligibleItems(){
    if(!revealTargets||!eligibleReveals) return;
    var now=performance.now();
    revealTargets.forEach(function(item){
      if(!eligibleReveals.has(item)||item.classList.contains('is-visible')||item.closest('[hidden]')) return;
      var section=item.closest('section, .hero-wrap');
      if(navigating&&(section!==navigationDestination||!arrivalPlayed)) return;
      if(item.classList.contains('section-divider')){showReveal(item,0);return;}
      var group=item.closest('.portfolio-videos-grid, .portfolio-featured-grid, .photography-grid, .hero-text, .about-copy, .contact-details, .process-steps')||section;
      var batch=revealBatches.get(group);
      if(!batch||now-batch.last>180) batch={count:0,last:now};
      var delay=Math.min(batch.count*(window.innerWidth<=900?60:70),window.innerWidth<=900?180:210);
      batch.count++;
      batch.last=now;
      revealBatches.set(group,batch);
      if(heroDelays.has(item)) delay=heroDelays.get(item);
      showReveal(item,delay);
    });
  }

  // Section-level class drives the gold underline beneath each heading; it is
  // added on entry and removed on exit so the underline replays in both scroll
  // directions, matching the rest of the reveal system.
  var revealSections=[].slice.call(document.querySelectorAll('section.reveal'));
  var revealSectionObserver=null;
  if(revealTargets.length&&'IntersectionObserver' in window&&!motionQuery.matches){
    revealObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          eligibleReveals.add(entry.target);
        } else {
          eligibleReveals.delete(entry.target);
          if(entry.intersectionRatio===0&&isFullyOutOfView(entry)) resetReveal(entry.target);
        }
      });
      revealEligibleItems();
    },{rootMargin:'0px 0px -32px 0px',threshold:0.05});
    revealTargets.forEach(function(item){
      item.classList.add('reveal-item');
      if(item.matches('h1, h2')) item.classList.add('editorial-heading');
      if(item.matches('.portfolio-card, .package-card, .photography-card')) item.classList.add('editorial-card');
      revealObserver.observe(item);
    });

    revealSectionObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
        } else if(isFullyOutOfView(entry)){
          entry.target.classList.remove('is-visible');
        }
      });
    },{rootMargin:'0px 0px -32px 0px',threshold:0.05});
    revealSections.forEach(function(section){revealSectionObserver.observe(section);});
    // The inline .js class alone never hides content if this script fails to load.
    root.classList.add('reveal-ready');
  } else if(!motionQuery.matches){
    // Without an observer the decorative state is simply on.
    revealSections.forEach(function(section){section.classList.add('is-visible');});
  }
  document.addEventListener('focusin',function(event){
    var item=event.target.closest('.reveal-item');
    if(item) showReveal(item,0);
  });
  document.addEventListener('animationend',function(event){
    if(event.animationName==='editorial-heading-arrival') event.target.classList.remove('is-arriving');
  });
  function reduceNavigationMotion(){
    if(!motionQuery.matches) return;
    cancelNavigation();
    revealTargets.forEach(function(item){item.classList.add('is-visible');});
    revealTargets.forEach(function(item){item.classList.remove('is-arriving');});
    revealSections.forEach(function(section){section.classList.add('is-visible');});
    eligibleReveals.clear();
    if(revealObserver) revealObserver.disconnect();
    if(revealSectionObserver) revealSectionObserver.disconnect();
  }
  if(motionQuery.addEventListener) motionQuery.addEventListener('change',function(){
    reduceMotion=motionQuery.matches;
    if(reduceMotion) reduceNavigationMotion();
    updateTimelineProgress();
    updateScrollProgress();
  });
  else motionQuery.addListener(function(){
    reduceMotion=motionQuery.matches;
    if(reduceMotion) reduceNavigationMotion();
    updateTimelineProgress();
    updateScrollProgress();
  });

  var prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var jewelShowreelVideo=document.querySelector('#showreel .jewel-autoplay');
  if(jewelShowreelVideo){
    jewelShowreelVideo.playsInline=true;
    jewelShowreelVideo.webkitPlaysInline=true;
    jewelShowreelVideo.setAttribute('playsinline','');
    jewelShowreelVideo.setAttribute('webkit-playsinline','');
    var jewelSoundButton=document.querySelector('#showreel .jewel-sound-toggle');
    var jewelActive=false;
    var jewelVisibleRatio=0;
    var jewelPreferredMuted=false;
    var jewelLastMuted=jewelShowreelVideo.muted;
    var jewelAudioFallback=false;
    var jewelPlayAttempt=0;
    var jewelShowreelObserver=null;

    function setJewelMuted(muted){
      // volumechange is queued; record our changes before it fires.
      jewelLastMuted=muted;
      jewelShowreelVideo.muted=muted;
    }

    function updateJewelSoundButton(){
      if(jewelSoundButton){
        jewelSoundButton.hidden=!(jewelActive&&!document.hidden&&jewelAudioFallback&&jewelShowreelVideo.muted&&jewelShowreelVideo.volume>0);
      }
    }

    function stopJewelShowreel(){
      jewelActive=false;
      // Invalidate any play promise still pending from the previous visit.
      jewelPlayAttempt++;
      try{jewelShowreelVideo.pause();}catch(error){}
      setJewelMuted(true);
      try{jewelShowreelVideo.currentTime=0;}catch(error){}
      jewelAudioFallback=false;
      updateJewelSoundButton();
    }

    function playJewelShowreel(attempt,allowMutedFallback){
      if(attempt!==jewelPlayAttempt||!jewelActive||document.hidden) return;

      function playbackStarted(){
        if(!jewelActive||document.hidden){stopJewelShowreel();return;}
        if(attempt===jewelPlayAttempt) updateJewelSoundButton();
      }

      function playbackFailed(error){
        if(attempt!==jewelPlayAttempt||!jewelActive||document.hidden) return;
        if(allowMutedFallback&&error&&error.name==='NotAllowedError'&&!jewelShowreelVideo.muted){
          jewelAudioFallback=true;
          setJewelMuted(true);
          updateJewelSoundButton();
          playJewelShowreel(attempt,false);
        }
      }

      try{
        var playPromise=jewelShowreelVideo.play();
        if(playPromise&&typeof playPromise.then==='function'){
          playPromise.then(playbackStarted,playbackFailed);
        } else {
          playbackStarted();
        }
      }catch(error){playbackFailed(error);}
    }

    function startJewelShowreel(){
      if(jewelActive||document.hidden) return;
      jewelActive=true;
      jewelAudioFallback=false;
      setJewelMuted(jewelPreferredMuted);
      updateJewelSoundButton();
      playJewelShowreel(++jewelPlayAttempt,true);
    }

    jewelShowreelVideo.addEventListener('volumechange',function(){
      var muted=jewelShowreelVideo.muted;
      if(muted!==jewelLastMuted){
        jewelLastMuted=muted;
        jewelPreferredMuted=muted;
        jewelPlayAttempt++;
        if(!muted) jewelAudioFallback=false;
      }
      if(jewelShowreelObserver&&(document.hidden||jewelVisibleRatio<0.30)){
        stopJewelShowreel();
      } else {
        updateJewelSoundButton();
      }
    });

    jewelShowreelVideo.addEventListener('pause',function(){
      if(jewelActive&&jewelShowreelVideo.paused) jewelPlayAttempt++;
    });

    jewelShowreelVideo.addEventListener('play',function(){
      if(document.hidden||(jewelShowreelObserver&&jewelVisibleRatio<0.30)){
        stopJewelShowreel();
      } else {
        // A native-controls play below the autoplay threshold is still allowed.
        jewelActive=true;
      }
    });

    if(jewelSoundButton){
      jewelSoundButton.addEventListener('click',function(){
        if(!jewelActive||document.hidden) return;
        jewelPreferredMuted=false;
        jewelAudioFallback=false;
        setJewelMuted(false);
        updateJewelSoundButton();
        // Keep this call inside the click gesture for mobile audio policies.
        playJewelShowreel(++jewelPlayAttempt,true);
      });
    }

    if('IntersectionObserver' in window){
      jewelShowreelObserver=new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          jewelVisibleRatio=entry.intersectionRatio||0;
          if(document.hidden||jewelVisibleRatio<0.30){
            stopJewelShowreel();
          } else if(jewelVisibleRatio>=0.55){
            startJewelShowreel();
          }
        });
      },{threshold:[0,0.30,0.55,1]});
      jewelShowreelObserver.observe(jewelShowreelVideo);
    }

    document.addEventListener('visibilitychange',function(){
      if(document.hidden){
        stopJewelShowreel();
      } else if(jewelShowreelObserver){
        // Request a fresh observer entry, including after a hidden-tab scroll.
        jewelVisibleRatio=0;
        jewelShowreelObserver.unobserve(jewelShowreelVideo);
        jewelShowreelObserver.observe(jewelShowreelVideo);
      }
    });

    window.addEventListener('pagehide',stopJewelShowreel);
  }

  var previewVideos=[].slice.call(document.querySelectorAll('.portfolio-video-preview'));
  var supportsHoverPreview=window.matchMedia('(hover: hover) and (pointer: fine)').matches&&!prefersReducedMotion;
  var activePreviewVideo=null;
  var previewTimeout=null;
  var previewPlayAttempt=0;
  var previewFrameTime=3;

  function getPreviewFrameTime(video){
    if(!Number.isFinite(video.duration)||video.duration<=0) return previewFrameTime;
    return Math.min(previewFrameTime,Math.max(0,video.duration-0.01));
  }

  function seekPreviewFrame(video){
    if(video.readyState<1||!Number.isFinite(video.duration)||video.duration<=0) return;
    try{video.currentTime=getPreviewFrameTime(video);}catch(error){}
  }

  function stopPreview(video){
    previewPlayAttempt++;
    if(previewTimeout){clearTimeout(previewTimeout);previewTimeout=null;}
    video.pause();
    video.muted=true;
    video.volume=0;
    var card=video.closest('.portfolio-card');
    if(card) card.classList.remove('is-preview-playing');
    if(video.readyState>=1){
      try{video.currentTime=getPreviewFrameTime(video);}catch(error){}
    }
    if(activePreviewVideo===video) activePreviewVideo=null;
  }

  function stopActivePreview(){
    if(activePreviewVideo) stopPreview(activePreviewVideo);
  }

  previewVideos.forEach(function(video){
    var card=video.closest('.portfolio-card');
    video.muted=true;
    video.volume=0;
    video.playsInline=true;
    video.setAttribute('muted','');
    video.addEventListener('loadedmetadata',function(){seekPreviewFrame(video);},{once:true});
    if(video.readyState>=1) seekPreviewFrame(video);

    if(!supportsHoverPreview||!card) return;

    card.addEventListener('pointerenter',function(event){
      if(event.pointerType!=='mouse'||document.hidden||card.hidden) return;
      stopActivePreview();
      activePreviewVideo=video;
      var attempt=++previewPlayAttempt;
      video.muted=true;
      video.volume=0;
      video.playsInline=true;
      video.setAttribute('muted','');

      function playPreview(){
        if(activePreviewVideo!==video||attempt!==previewPlayAttempt) return;
        seekPreviewFrame(video);
        var playback=video.play();
        if(playback&&typeof playback.then==='function'){
          playback.then(function(){
            if(activePreviewVideo!==video){video.pause();return;}
            if(attempt!==previewPlayAttempt) return;
            card.classList.add('is-preview-playing');
            previewTimeout=setTimeout(function(){
              if(activePreviewVideo===video&&attempt===previewPlayAttempt) stopPreview(video);
            },5000);
          }).catch(function(){
            if(activePreviewVideo===video&&attempt===previewPlayAttempt) stopPreview(video);
          });
        } else {
          card.classList.add('is-preview-playing');
          previewTimeout=setTimeout(function(){
            if(activePreviewVideo===video&&attempt===previewPlayAttempt) stopPreview(video);
          },5000);
        }
      }

      if(video.readyState>=1) playPreview();
      else video.addEventListener('loadedmetadata',playPreview,{once:true});
    });

    card.addEventListener('pointerleave',function(event){
      if(event.pointerType==='mouse'&&activePreviewVideo===video) stopPreview(video);
    });
  });

  document.addEventListener('visibilitychange',function(){
    if(document.hidden) stopActivePreview();
  });
  window.addEventListener('pagehide',stopActivePreview);

  var cards=[].slice.call(document.querySelectorAll('.portfolio-card[data-video], .showreel-card[data-video]'));
  if(cards.length){
    var dialog=document.createElement('dialog');
    dialog.className='video-modal';
    dialog.setAttribute('role','dialog');
    dialog.setAttribute('aria-modal','true');
    dialog.setAttribute('aria-label','Video player');
    dialog.innerHTML='<button type="button" class="modal-close" aria-label="Close video">&times;</button><div class="modal-body"><div class="modal-player"></div><p class="modal-title"></p><a class="modal-fallback" href="#" target="_blank" rel="noopener noreferrer">Watch on original site</a></div>';
    document.body.appendChild(dialog);

    var playerWrap=dialog.querySelector('.modal-player');
    var titleEl=dialog.querySelector('.modal-title');
    var fallback=dialog.querySelector('.modal-fallback');
    var closeBtn=dialog.querySelector('.modal-close');
    var lastFocused=null;
    var previousOverflow='';
    var videoCloseTimer=null;

    function isFacebook(url){
      var host=new URL(url,window.location.href).hostname.toLowerCase();
      return host==='facebook.com'||host.endsWith('.facebook.com')||host==='fb.watch'||host.endsWith('.fb.watch');
    }
    function isYouTube(url){
      var host=new URL(url,window.location.href).hostname.toLowerCase();
      return host==='youtube.com'||host.endsWith('.youtube.com')||host==='youtu.be';
    }
    function isVimeo(url){
      var host=new URL(url,window.location.href).hostname.toLowerCase();
      return host==='vimeo.com'||host.endsWith('.vimeo.com')||host==='player.vimeo.com';
    }
    function isLocalVideo(url){
      if(!url) return false;
      try {
        var normalized=url.toLowerCase();
        return /\.(mp4|webm|ogg|mov)(?:[?#].*)?$/.test(normalized) || normalized.indexOf('/assets/videos/') !== -1 || normalized.indexOf('assets/videos/') !== -1;
      } catch (error) {
        return false;
      }
    }
    function youTubeId(url){
      var parsed=new URL(url);
      if(parsed.hostname.toLowerCase().endsWith('youtu.be')) return parsed.pathname.split('/').filter(Boolean)[0]||'';
      return parsed.searchParams.get('v')||parsed.pathname.match(/\/(?:embed|shorts|live)\/([^/]+)/)?.[1]||'';
    }
    function vimeoId(url){
      var parsed=new URL(url);
      var host=parsed.hostname.toLowerCase();
      if(host==='player.vimeo.com') return (parsed.pathname.match(/\/video\/([0-9]+)/) || [])[1] || '';
      return (parsed.pathname.match(/\/([0-9]+)/) || [])[1] || '';
    }

    function openModal(card){
      if(videoCloseTimer){clearTimeout(videoCloseTimer);videoCloseTimer=null;}
      dialog.classList.remove('is-closing');
      lastFocused=card;
      var url=card.getAttribute('data-video');
      var title=card.getAttribute('data-title')||'';
      var orientation=card.getAttribute('data-orientation')==='portrait'?'portrait':'landscape';
      var poster=card.getAttribute('data-poster')||'';
      titleEl.textContent=title;
      fallback.href=url||'#';
      fallback.style.display='none';
      playerWrap.innerHTML='';
      dialog.classList.toggle('is-portrait',orientation==='portrait');

      var facebook=false;
      var youtube=false;
      var vimeo=false;
      var localVideo=false;
      try{facebook=isFacebook(url);youtube=isYouTube(url);vimeo=isVimeo(url);}catch(error){}
      localVideo=isLocalVideo(url);

      if(facebook){
        var iframe=document.createElement('iframe');
        iframe.src='https://www.facebook.com/plugins/video.php?href='+encodeURIComponent(url)+'&show_text=false&t=0';
        iframe.title=title||'Facebook video';
        iframe.allow='autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
        iframe.allowFullscreen=true;
        iframe.setAttribute('frameborder','0');
        iframe.style.width='100%';
        iframe.style.height='100%';
        playerWrap.appendChild(iframe);
        fallback.textContent='Watch on Facebook';
        fallback.style.display='inline-block';
      } else if(youtube){
        var id=youTubeId(url);
        if(id){
          var iframe=document.createElement('iframe');
          iframe.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=0&rel=0';
          iframe.title=title||'YouTube video';
          iframe.allow='autoplay; clipboard-write; encrypted-media; picture-in-picture';
          iframe.allowFullscreen=true;
          iframe.setAttribute('frameborder','0');
          iframe.style.width='100%';
          iframe.style.height='100%';
          playerWrap.appendChild(iframe);
          fallback.textContent='Watch on YouTube';
          fallback.style.display='inline-block';
        } else {
          fallback.textContent='Watch on YouTube';
          fallback.style.display='inline-block';
        }
      } else if(vimeo){
        var vimeoIdValue=vimeoId(url);
        if(vimeoIdValue){
          var vimeoIframe=document.createElement('iframe');
          vimeoIframe.src='https://player.vimeo.com/video/'+encodeURIComponent(vimeoIdValue)+'?title=0&byline=0&portrait=0';
          vimeoIframe.title=title||'Vimeo video';
          vimeoIframe.allow='autoplay; fullscreen; picture-in-picture';
          vimeoIframe.allowFullscreen=true;
          vimeoIframe.setAttribute('frameborder','0');
          vimeoIframe.style.width='100%';
          vimeoIframe.style.height='100%';
          playerWrap.appendChild(vimeoIframe);
          fallback.textContent='Watch on Vimeo';
          fallback.style.display='inline-block';
        } else {
          fallback.textContent='Watch on Vimeo';
          fallback.style.display='inline-block';
        }
      } else if(localVideo){
        var localVideoEl=document.createElement('video');
        localVideoEl.controls=true;
        localVideoEl.preload='metadata';
        localVideoEl.playsInline=true;
        localVideoEl.setAttribute('playsinline','true');
        localVideoEl.setAttribute('controls','controls');
        if(poster){ localVideoEl.poster=poster; }
        var sourceEl=document.createElement('source');
        sourceEl.src=url;
        sourceEl.type='video/mp4';
        localVideoEl.appendChild(sourceEl);
        playerWrap.appendChild(localVideoEl);
        fallback.textContent='Open video file';
        fallback.style.display='inline-block';
      } else {
        var externalLink=document.createElement('a');
        externalLink.href=url;
        externalLink.target='_blank';
        externalLink.rel='noopener noreferrer';
        externalLink.style.position='fixed';
        externalLink.style.left='-9999px';
        document.body.appendChild(externalLink);
        externalLink.click();
        externalLink.remove();
        return;
      }

      if(!dialog.open) previousOverflow=document.body.style.overflow;
      if(!dialog.open) dialog.showModal();
      dialog.classList.add('is-open');
      document.body.style.overflow='hidden';
      closeBtn.focus();
      if(localVideoEl){
        var playback=localVideoEl.play();
        if(playback&&typeof playback.catch==='function') playback.catch(function(){});
      }
    }

    function closeModal(){
      if(!dialog.open||dialog.classList.contains('is-closing')) return;
      var activeVideo=playerWrap.querySelector('video');
      if(activeVideo){
        activeVideo.pause();
        try{activeVideo.currentTime=0;}catch(error){}
      }
      var activeFrame=playerWrap.querySelector('iframe');
      if(activeFrame){
        activeFrame.src='';
      }
      dialog.classList.remove('is-open');
      dialog.classList.add('is-closing');
      document.body.style.overflow=previousOverflow;
      videoCloseTimer=window.setTimeout(function(){
        videoCloseTimer=null;
        dialog.classList.remove('is-closing','is-portrait');
        if(activeVideo){
          activeVideo.removeAttribute('src');
          [].slice.call(activeVideo.querySelectorAll('source')).forEach(function(source){source.removeAttribute('src');});
          activeVideo.load();
        }
        playerWrap.innerHTML='';
        if(dialog.open) dialog.close();
        if(lastFocused) lastFocused.focus();
      },prefersReducedMotion?0:180);
    }

    cards.forEach(function(card){
      card.addEventListener('click',function(){stopActivePreview();openModal(card);});
    });

    closeBtn.addEventListener('click',closeModal);
    dialog.addEventListener('cancel',function(e){e.preventDefault();closeModal();});
    dialog.addEventListener('click',function(e){if(e.target===dialog) closeModal();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape' && dialog.classList.contains('is-open')){e.preventDefault(); closeModal();}});
  }

  var packageTabs=[].slice.call(document.querySelectorAll('.package-tab'));
  if(packageTabs.length){
    var packageCategories=[].slice.call(document.querySelectorAll('.package-category'));
    function selectPackage(category){
      packageTabs.forEach(function(tab){
        var selected=tab.getAttribute('data-category')===category;
        tab.setAttribute('aria-selected',selected?'true':'false');
        tab.setAttribute('tabindex',selected?'0':'-1');
        tab.classList.toggle('is-active',selected);
      });
      packageCategories.forEach(function(panel){panel.hidden=panel.getAttribute('data-category')!==category;});
    }

    selectPackage(packageTabs[0].getAttribute('data-category'));
    packageTabs.forEach(function(tab){
      tab.addEventListener('click',function(){selectPackage(tab.getAttribute('data-category'));});
      tab.addEventListener('keydown',function(e){
        var idx=packageTabs.indexOf(tab);
        var next=idx;
        if(e.key==='ArrowRight') next=(idx+1)%packageTabs.length;
        else if(e.key==='ArrowLeft') next=(idx-1+packageTabs.length)%packageTabs.length;
        else if(e.key==='Home') next=0;
        else if(e.key==='End') next=packageTabs.length-1;
        else return;
        e.preventDefault();
        packageTabs[next].focus();
        selectPackage(packageTabs[next].getAttribute('data-category'));
      });
    });

    document.querySelectorAll('.film-tile[data-category]').forEach(function(tile){
      tile.addEventListener('click',function(){
        var category=tile.getAttribute('data-category');
        if(packageTabs.some(function(tab){return tab.getAttribute('data-category')===category;})) selectPackage(category);
      });
    });
  }

  var filterChips=[].slice.call(document.querySelectorAll('.filter-chip'));
  if(filterChips.length){
    var filterTargets=[].slice.call(document.querySelectorAll('.portfolio-card[data-category]'));
    var portfolioGroups=[].slice.call(document.querySelectorAll('[data-portfolio-group]'));
    var filterWrap=document.querySelector('.portfolio-filters');
    var filterIndicator=document.querySelector('.filter-indicator');
    function positionFilterIndicator(){
      if(!filterWrap||!filterIndicator) return;
      var active=filterWrap.querySelector('.filter-chip.is-active');
      if(!active){filterIndicator.classList.remove('is-positioned');return;}
      filterIndicator.style.width=active.offsetWidth+'px';
      filterIndicator.style.transform='translate3d('+active.offsetLeft+'px,0,0)';
      filterIndicator.classList.add('is-positioned');
      // Keep the active chip visible when the control scrolls on small screens.
      if(filterWrap.scrollWidth>filterWrap.clientWidth){
        var target=active.offsetLeft-(filterWrap.clientWidth-active.offsetWidth)/2;
        filterWrap.scrollLeft=Math.max(0,target);
      }
    }
    filterChips.forEach(function(chip){
      chip.addEventListener('click',function(){
        stopActivePreview();
        var filter=chip.getAttribute('data-filter');
        filterChips.forEach(function(c){c.classList.remove('is-active');c.setAttribute('aria-selected','false');});
        chip.classList.add('is-active');
        chip.setAttribute('aria-selected','true');
        positionFilterIndicator();
        filterTargets.forEach(function(el){
          var cat=el.getAttribute('data-category')||'';
          if(filter==='all'||cat===filter){el.hidden=false;} else {el.hidden=true;}
        });
        portfolioGroups.forEach(function(group){
          group.hidden=!group.querySelector('.portfolio-card[data-category]:not([hidden])');
        });
      });
      chip.addEventListener('keydown',function(e){
        var idx=filterChips.indexOf(chip);
        var next=idx;
        if(e.key==='ArrowRight') next=(idx+1)%filterChips.length;
        else if(e.key==='ArrowLeft') next=(idx-1+filterChips.length)%filterChips.length;
        else return;
        e.preventDefault();
        filterChips[next].focus();
        filterChips[next].click();
      });
    });
    positionFilterIndicator();
    window.addEventListener('resize',positionFilterIndicator);
    if(document.fonts&&document.fonts.ready){document.fonts.ready.then(positionFilterIndicator);}
    window.addEventListener('load',positionFilterIndicator,{once:true});
  }

  var mobileBar=document.getElementById('mobileBar');
  var contactSection=document.getElementById('contact');
  if(mobileBar && contactSection && 'IntersectionObserver' in window){
    var io3=new IntersectionObserver(function(es){es.forEach(function(en){
      if(en.isIntersecting){mobileBar.classList.add('is-hidden');} else {mobileBar.classList.remove('is-hidden');}
    });},{rootMargin:'0px',threshold:0.1});
    io3.observe(contactSection);
  }
})();
