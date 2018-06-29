import glob
import os

for path in glob.glob("./shield-integrated-addon/addons/taar-study/addon/webextension/popup/locales/*"):
  try:
    with open(path+"/raw.txt") as f:
      raw = f.read()
    header, body, buttons = raw.split("]]]\n\n")[1].split("\n---\n")
    close, browse = buttons.split(",")
    html = """
    <!DOCTYPE HTML>

    <html>
      <head>
      <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <link  rel="stylesheet" type="text/css" href="../../popup.css">
      </head>
      <body>
        <div id="topbar"></div>
        <div id="topsection">
          <div id="picture">
              <img id="icon" src="../../img/extensionsicon.svg" />
          </div>
          <div id="textsection">
            <div id="messagesection">
              <h1 id="header">{}</h1>
              <p>{}</p>
            </div>
          </div>
        </div>
        
        <div id="bottomsection">
          <div id="button-container">
                  <button id="close-button" class="button-style">{}</button>

            <button id="browse-addons-button" class="button-style">{}</button>
          </div>
        </div>
       <script src="../../popup.js"></script> 
      </body>
    </html>
    """.format(header, body, close, browse)

    with open(path + "/popup.html", "w") as f:
        f.write(html)

  except:
    print "error for ", path



