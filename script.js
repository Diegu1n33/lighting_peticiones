const cardsContainer = document.querySelector(".cards-container");
const newCardBtn = document.querySelector(".new-card-btn");
const nombreInput = document.querySelector("#nombreInput");
const peticionInput = document.querySelector("#peticionInput");
const fontSlider = document.querySelector("#fontSlider");

let isEditing = false;


// CAMBIAR TAMAÑO DE TEXTO
if (fontSlider) {

  fontSlider.addEventListener("input", () => {

    const editors = document.querySelectorAll(".editor");

    editors.forEach(editor => {

      editor.style.fontSize =
        fontSlider.value + "px";

    });

  });

}


window.addEventListener("load", () => {

  const db = window.db;

  const {
    collection,
    addDoc,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
  } = window.firebaseFirestore;

  const tarjetasRef =
    collection(db, "tarjetas");


  // TIEMPO REAL
  onSnapshot(tarjetasRef, (snapshot) => {

    if (isEditing) return;

    cardsContainer.innerHTML = "";

    snapshot.forEach((firebaseDoc) => {

      const tarjeta = firebaseDoc.data();

      const card = document.createElement("div");

      card.classList.add("card");

      card.innerHTML = `
        <div class="card-header">

          <h2
            contenteditable="true"
            data-id="${firebaseDoc.id}"
            class="editable-name"
          >
            ${tarjeta.nombre || ""}
          </h2>

          <button
            class="delete-btn"
            data-id="${firebaseDoc.id}"
          >
            ✕
          </button>

        </div>

        <div
          class="editor editable-text"
          contenteditable="true"
          data-id="${firebaseDoc.id}"
        >
${tarjeta.texto || ""}
        </div>
      `;

      cardsContainer.appendChild(card);

    });


    // EDITAR NOMBRE
    document
      .querySelectorAll(".editable-name")
      .forEach(element => {

        element.addEventListener("focus", () => {

          isEditing = true;

        });

        element.addEventListener("blur", async () => {

          isEditing = false;

          const id = element.dataset.id;

          const tarjetaDoc =
            doc(db, "tarjetas", id);

          await updateDoc(tarjetaDoc, {

            nombre: element.innerText

          });

        });

      });


    // EDITAR TEXTO
    document
      .querySelectorAll(".editable-text")
      .forEach(element => {

        element.addEventListener("focus", () => {

          isEditing = true;

        });

        element.addEventListener("blur", async () => {

          isEditing = false;

          const id = element.dataset.id;

          const tarjetaDoc =
            doc(db, "tarjetas", id);

          await updateDoc(tarjetaDoc, {

            texto: element.innerText

          });

        });

      });


    // ELIMINAR TARJETA
    document
      .querySelectorAll(".delete-btn")
      .forEach(button => {

        button.addEventListener("click", async () => {

          const id = button.dataset.id;

          const confirmar =
            confirm("¿Eliminar tarjeta?");

          if (!confirmar) return;

          await deleteDoc(
            doc(db, "tarjetas", id)
          );

        });

      });

  });


  // CREAR TARJETA
  if (newCardBtn) {

    newCardBtn.addEventListener("click", async () => {

      const nombre =
        nombreInput.value.trim();

      const texto =
        peticionInput.value.trim();

      if (!nombre) return;

      await addDoc(tarjetasRef, {

        nombre,
        texto

      });

      nombreInput.value = "";
      peticionInput.value = "";

    });

  }

});