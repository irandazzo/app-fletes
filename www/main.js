// ==========================================
// CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAz56gxrDX_bY4bQ_kN7UFTjrpf2LVlFnk",
    authDomain: "fletarg-db.firebaseapp.com",
    projectId: "fletarg-db",
    storageBucket: "fletarg-db.firebasestorage.app",
    messagingSenderId: "621620714229",
    appId: "1:621620714229:web:b2cef10225322f5d07c3bc"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();


document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. PROTECCIÓN DE RUTAS (NUBE)
    // ==========================================
    const path = window.location.pathname;

    auth.onAuthStateChanged(async (user) => {
        const protectedPaths = ['cliente', 'proveedor', 'perfil'];
        const isProtected = protectedPaths.some(p => path.includes(p));

        if (isProtected && !user) {
            window.location.href = 'index.html';
            return;
        }

        if (user) {
            try {
                let docSnap = await db.collection("usuarios").doc(user.uid).get();
                if (!docSnap.exists) {
                    docSnap = await db.collection("usuarios").doc(user.email).get();
                }

                if (docSnap.exists) {
                    const usuarioData = docSnap.data();
                    const rol = (usuarioData.rol || '').toLowerCase();

                    if (rol === 'cliente' && path.includes('proveedor')) {
                        window.location.href = 'cliente.html';
                    } else if (rol === 'proveedor' && path.includes('cliente')) {
                        window.location.href = 'proveedor-perfil.html';
                    }
                }
            } catch (e) {
                console.error("Error verificando rol en nube:", e);
            }
        }
    });
    
    // ==========================================
    // 1. SELECCIÓN DE VEHÍCULOS (Cliente)
    // ==========================================
    const tarjetasVehiculo = document.querySelectorAll('.opcion-card');
    if (tarjetasVehiculo.length > 0) {
        tarjetasVehiculo.forEach(tarjeta => {
            tarjeta.addEventListener('click', () => {
                tarjetasVehiculo.forEach(t => t.classList.remove('activa'));
                tarjeta.classList.add('activa');
            });
        });
    }

    // ==========================================
    // 2. SELECCIÓN DE TIEMPO
    // ==========================================
    const botonesCuando = document.querySelectorAll('.btn-opcion-cuando');
    const inputTipoViajeSel = document.getElementById('tipo-viaje-seleccion');
    const contenedorFecha = document.getElementById("contenedor-fecha");
    const inputFechaProgramada = document.getElementById("fecha-programada");
    const textoFechaElegida = document.getElementById("texto-fecha-elegida");

    botonesCuando.forEach(boton => {
        boton.addEventListener('click', (e) => {
            botonesCuando.forEach(b => b.classList.remove('activo'));
            e.target.classList.add('activo');

            const valorElegido = e.target.getAttribute('data-valor');
            if (inputTipoViajeSel) inputTipoViajeSel.value = valorElegido;

            if (valorElegido === 'programado') {
                if (contenedorFecha) contenedorFecha.style.display = "block";
                
                if (inputFechaProgramada) {
                    const ahora = new Date();
                    const anio = ahora.getFullYear();
                    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
                    const dia = String(ahora.getDate()).padStart(2, '0');
                    const hora = String(ahora.getHours()).padStart(2, '0');
                    const min = String(ahora.getMinutes()).padStart(2, '0');
                    
                    inputFechaProgramada.min = `${anio}-${mes}-${dia}T${hora}:${min}`;
                }
            } else {
                if (contenedorFecha) contenedorFecha.style.display = "none";
                if (inputFechaProgramada) inputFechaProgramada.value = "";
                if (textoFechaElegida) {
                    textoFechaElegida.style.display = 'none';
                    textoFechaElegida.innerText = '';
                }
            }
        });
    });

    if (inputFechaProgramada) {
        inputFechaProgramada.addEventListener("change", (e) => {
            const valor = e.target.value;
            if (valor && textoFechaElegida) {
                const fechaObj = new Date(valor);
                const fechaLegible = fechaObj.toLocaleString('es-AR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                });

                textoFechaElegida.innerText = `✔️ Fecha programada: ${fechaLegible}`;
                textoFechaElegida.style.display = 'block';
            }
        });
    }

    // ==========================================
    // 3. SERVICIOS ADICIONALES (Peón y Escalera)
    // ==========================================
    const checkPeon = document.getElementById("peon");
    const contPeon = document.getElementById("peon-cantidad-container");
    if (checkPeon && contPeon) {
        checkPeon.addEventListener("change", (e) => {
            if (e.target.checked) {
                contPeon.style.display = "flex";
                checkPeon.closest('.check-item').classList.add("abierto");
            } else {
                contPeon.style.display = "none";
                checkPeon.closest('.check-item').classList.remove("abierto");
            }
        });
    }

    const checkEscalera = document.getElementById("escalera");
    const contEscalera = document.getElementById("escalera-pisos-container");
    if (checkEscalera && contEscalera) {
        checkEscalera.addEventListener("change", (e) => {
            if (e.target.checked) {
                contEscalera.style.display = "flex";
                checkEscalera.closest('.check-item').classList.add("abierto");
            } else {
                contEscalera.style.display = "none";
                checkEscalera.closest('.check-item').classList.remove("abierto");
            }
        });
    }

    // ==========================================
    // 4. AUTOCOMPLETADO DE DIRECCIONES
    // ==========================================
    function configurarAutocompletado(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const formGroup = input.parentElement;
        const sugerenciasBox = document.createElement('div');
        sugerenciasBox.className = 'sugerencias-box';
        formGroup.appendChild(sugerenciasBox);

        let timeoutId;

        input.addEventListener('input', (e) => {
            const query = e.target.value;
            clearTimeout(timeoutId);
            
            if (query.length < 3) {
                sugerenciasBox.style.display = 'none';
                return;
            }

            timeoutId = setTimeout(async () => {
                try {
                    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lat=-34.6037&lon=-58.3816`;
                    const respuesta = await fetch(url);
                    const datos = await respuesta.json();

                    sugerenciasBox.innerHTML = '';
                    
                    if (datos.features.length > 0) {
                        sugerenciasBox.style.display = 'block';
                        datos.features.forEach(feature => {
                            const prop = feature.properties;
                            const item = document.createElement('div');
                            item.className = 'sugerencia-item';
                            
                            const nombre = prop.name ? prop.name + ', ' : '';
                            const calle = prop.street ? prop.street + ', ' : '';
                            const ciudad = prop.city || prop.state || '';
                            
                            item.textContent = `${nombre}${calle}${ciudad}`;
                            item.addEventListener('click', () => {
                                input.value = item.textContent;
                                sugerenciasBox.style.display = 'none';
                            });
                            sugerenciasBox.appendChild(item);
                        });
                    } else {
                        sugerenciasBox.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Error buscando dirección:", error);
                }
            }, 300);
        });

        document.addEventListener('click', (e) => {
            if (e.target !== input && e.target !== sugerenciasBox) {
                sugerenciasBox.style.display = 'none';
            }
        });
    }

    configurarAutocompletado('origen');
    configurarAutocompletado('destino');

    // ==========================================
    // 5. REGISTRO DE USUARIOS
    // ==========================================
    const formRegistro = document.getElementById('form-registro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const nombre = document.getElementById('nombre').value.trim();
            const apellido = document.getElementById('apellido').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('contrasena-reg').value.trim();
            const rol = document.getElementById('rol-elegido').value;

            try {
                const credencial = await auth.createUserWithEmailAndPassword(email, password);
                const user = credencial.user;

                let datosUsuario = {
                    uid: user.uid,
                    nombre: nombre,
                    apellido: apellido,
                    email: email,
                    rol: rol,
                    fechaCreacion: new Date().toISOString()
                };

                if (rol === 'proveedor') {
                    datosUsuario.tarifas = {
                        precioPiso: parseFloat(document.getElementById('precio-piso').value) || 0,
                        ofrecePeon: document.getElementById('ofrece-peon').value,
                        precioPeon: parseFloat(document.getElementById('precio-peon').value) || 0,
                        negociar: document.getElementById('acepta-negociar').value
                    };
                    datosUsuario.vehiculos = []; 
                }

                await db.collection("usuarios").doc(user.uid).set(datosUsuario);
                
                mostrarModalMensaje('¡Cuenta creada!', 'Tu cuenta ha sido creada con éxito en la nube.', 'exito', () => {
                    if (rol === 'cliente') {
                        window.location.href = 'cliente.html';
                    } else if (rol === 'proveedor') {
                        window.location.href = 'proveedor-perfil.html';
                    }
                });

            } catch (error) {
                console.error("Error detallado en el registro:", error);
                if (error.code === 'auth/email-already-in-use') {
                    mostrarModalMensaje('Correo en uso', 'Este correo electrónico ya está registrado.', 'advertencia');
                } else if (error.code === 'auth/weak-password') {
                    mostrarModalMensaje('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.', 'advertencia');
                } else {
                    mostrarModalMensaje('Error de Registro', 'Ocurrió un error: ' + error.message, 'error');
                }
            }
        });
    }

    // ==========================================
    // 6. INICIO DE SESIÓN (LOGIN)
    // ==========================================
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault();
            const emailIngresado = document.getElementById('usuario').value.trim();
            const passwordIngresada = document.getElementById('contrasena').value.trim();

            try {
                const credencial = await auth.signInWithEmailAndPassword(emailIngresado, passwordIngresada);
                const user = credencial.user;

                if (!user) {
                    mostrarModalMensaje('Error', 'No se pudo autenticar el usuario.', 'error');
                    return;
                }

                let docSnap = await db.collection("usuarios").doc(user.uid).get();
                if (!docSnap.exists) {
                    docSnap = await db.collection("usuarios").doc(user.email).get();
                }

                if (!docSnap.exists) {
                    mostrarModalMensaje('Perfil no encontrado', 'Tu cuenta existe pero no se hallaron tus datos en Firestore.', 'error');
                    return;
                }

                const usuario = docSnap.data();
                const rol = (usuario.rol || '').toLowerCase().trim();

                registrarAccionEnBitacora('LOGIN', `Inicio de sesión exitoso (${rol})`, user.email);

                if (rol === 'cliente') {
                    window.location.href = 'cliente.html';
                } else if (rol === 'proveedor') {
                    window.location.href = 'proveedor-perfil.html';
                } else {
                    mostrarModalMensaje('Error de Rol', `El rol '${rol}' no es válido.`, 'error');
                }

            } catch (error) {
                console.error("Error detallado en login:", error);
                mostrarModalMensaje('Error de Acceso', 'Correo o contraseña incorrectos.', 'error');
            }
        });
    }

    // ==========================================
    // 7. COTIZACIÓN Y CONFIRMACIÓN DE VIAJE
    // ==========================================
    const btnCotizar = document.querySelector('.panel-pedido .btn-principal');
    const modalConfirmacion = document.getElementById('modal-confirmacion');
    const btnCancelarModal = document.getElementById('btn-cancelar-modal'); 
    const btnConfirmarViaje = document.getElementById('btn-confirmar-viaje'); 
    const modalDetalles = document.getElementById('modal-detalles');

    let datosViajeTemporal = null;

    if (btnCotizar && document.body.classList.contains('body-cliente')) {
        btnCotizar.addEventListener('click', async () => {
            const origenInput = document.getElementById('origen');
            const destinoInput = document.getElementById('destino');
            const vehiculoActivo = document.querySelector('.opcion-card.activa .nombre-vehiculo');
            const inputTipoViajeSel = document.getElementById('tipo-viaje-seleccion');
            const inputFechaProgramada = document.getElementById('fecha-programada');

            const origen = origenInput ? origenInput.value.trim() : '';
            const destino = destinoInput ? destinoInput.value.trim() : '';
            const tipoVehiculo = vehiculoActivo ? vehiculoActivo.innerText : 'Moto';

            if (!origen || !destino) {
                mostrarModalMensaje('Faltan datos', 'Completá origen y destino.', 'advertencia');
                return;
            }

            const tipoViajeVal = inputTipoViajeSel ? inputTipoViajeSel.value : '';
            const fechaInputVal = inputFechaProgramada ? inputFechaProgramada.value.trim() : '';

            if (!tipoViajeVal) {
                mostrarModalMensaje('Falta programación', 'Indicá cuándo necesitás el flete.', 'advertencia');
                return;
            }

            let precioKmBase = 1200;
            let costoPisoUnitario = 3000;
            let costoPeonUnitario = 8000;

            try {
                const snapshotProv = await db.collection("usuarios").where("rol", "==", "proveedor").get();
                snapshotProv.forEach(doc => {
                    const provData = doc.data();
                    if (provData.vehiculos) {
                        const vehEncontrado = provData.vehiculos.find(v => v.tipo === tipoVehiculo);
                        if (vehEncontrado && vehEncontrado.precioKm) {
                            precioKmBase = vehEncontrado.precioKm;
                        }
                    }
                    if (provData.tarifas) {
                        if (provData.tarifas.precioPiso) costoPisoUnitario = provData.tarifas.precioPiso;
                        if (provData.tarifas.precioPeon) costoPeonUnitario = provData.tarifas.precioPeon;
                    }
                });
            } catch (e) {
                console.error("Error buscando tarifas:", e);
            }

            let precioBase = precioKmBase * 15; 
            if (tipoVehiculo === 'Pickup') precioBase = precioKmBase * 18;
            if (tipoVehiculo === 'Camión') precioBase = precioKmBase * 25;

            const quierePeon = document.getElementById('peon').checked;
            const cantPeones = parseInt(document.getElementById('cantidad-peones').value) || 1;
            let costoPeon = quierePeon ? (cantPeones * costoPeonUnitario) : 0; 

            const hayEscalera = document.getElementById('escalera').checked;
            const cantPisos = parseInt(document.getElementById('cantidad-pisos').value) || 1;
            let costoEscalera = hayEscalera ? (cantPisos * costoPisoUnitario) : 0; 

            const precioTotalNum = precioBase + costoPeon + costoEscalera;
            const precioFormateado = `$ ${precioTotalNum.toLocaleString('es-AR')}`;

            const cargaVal = document.getElementById('detalle-carga').value.trim() || 'Sin especificar';
            const pagoVal = document.getElementById('metodo-pago').value;
            
            let textoFechaHora = '⚡ Lo antes posible';
            if (tipoViajeVal === 'programado' && fechaInputVal) {
                const fechaObj = new Date(fechaInputVal);
                textoFechaHora = fechaObj.toLocaleString('es-AR', { 
                    day: '2-digit', month: '2-digit', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit' 
                });
            }

            const currentUser = auth.currentUser;

            datosViajeTemporal = {
                id: Date.now(),
                clienteEmail: currentUser ? currentUser.email : 'Anónimo',
                origen,
                destino,
                vehiculo: tipoVehiculo,
                precio: precioFormateado,
                estado: 'pendiente',
                detallesExtra: {
                    tipoViaje: textoFechaHora,
                    peones: quierePeon ? `${cantPeones} ayudante(s) ($ ${costoPeon.toLocaleString('es-AR')})` : 'No',
                    escalera: hayEscalera ? `${cantPisos} piso(s) ($ ${costoEscalera.toLocaleString('es-AR')})` : 'No',
                    carga: cargaVal,
                    pago: pagoVal
                }
            };

            if (modalDetalles) {
                modalDetalles.innerHTML = `
                    <p><strong>Vehículo:</strong> ${tipoVehiculo}</p>
                    <p>📍 <strong>Origen:</strong> ${origen}</p>
                    <p>🏁 <strong>Destino:</strong> ${destino}</p>
                    <p>📅 <strong>Cuándo:</strong> ${textoFechaHora}</p>
                    <p>👷 <strong>Peones:</strong> ${datosViajeTemporal.detallesExtra.peones}</p>
                    <p>🪜 <strong>Escalera:</strong> ${datosViajeTemporal.detallesExtra.escalera}</p>
                    <p>📦 <strong>Carga:</strong> ${cargaVal}</p>
                    <p>💳 <strong>Pago:</strong> ${pagoVal.toUpperCase()}</p>
                    <hr style="margin: 10px 0; border:0; border-top:1px solid #eee;">
                    <p style="font-size: 16px; color: #28a745; text-align: right;"><strong>Total Estimado: ${precioFormateado}</strong></p>
                `;
            }

            if (modalConfirmacion) {
                modalConfirmacion.classList.remove('oculto');
            }
        });
    }

    if (btnCancelarModal) {
        btnCancelarModal.addEventListener('click', () => {
            modalConfirmacion.classList.add('oculto');
            datosViajeTemporal = null;
        });
    }

    if (btnConfirmarViaje) {
        btnConfirmarViaje.addEventListener('click', async () => {
            if (!datosViajeTemporal) return;

            try {
                await db.collection("viajes").doc(datosViajeTemporal.id.toString()).set(datosViajeTemporal);

                const userEmail = auth.currentUser ? auth.currentUser.email : 'Cliente';
                registrarAccionEnBitacora('VIAJE_CREADO', `Flete creado por ${datosViajeTemporal.precio}`, userEmail);

                modalConfirmacion.classList.add('oculto');
                mostrarModalMensaje('¡Flete publicado!', 'Tu pedido de flete ya está visible para los proveedores.', 'exito', () => {
                    document.getElementById('origen').value = '';
                    document.getElementById('destino').value = '';
                    document.getElementById('detalle-carga').value = '';
                    datosViajeTemporal = null;
                });
            } catch (error) {
                console.error("Error al publicar:", error);
                mostrarModalMensaje('Error', 'Hubo un error al publicar el viaje.', 'error');
            }
        });
    }

    // ==========================================
    // 8. RENDERIZAR VIAJES DEL PROVEEDOR
    // ==========================================
    window.filtroVehiculoActual = 'todos'; 
    window.renderizarViajesProveedor = function(filtro = 'todos') {
        window.filtroVehiculoActual = filtro;
    };

    const contenedorPendientes = document.getElementById('lista-viajes-pendientes');
    const contenedorAceptados = document.getElementById('lista-viajes-aceptados');
    const contenedorCompletados = document.getElementById('lista-viajes-completados');

    if (contenedorPendientes || contenedorAceptados || contenedorCompletados) {
        db.collection("viajes").onSnapshot((snapshot) => {
            let viajes = [];
            snapshot.forEach(doc => viajes.push(doc.data()));

            const filtroActual = window.filtroVehiculoActual || 'todos';
            let pendientes = viajes.filter(v => v.estado === 'pendiente');
            const aceptados = viajes.filter(v => v.estado === 'aceptado');
            const completados = viajes.filter(v => v.estado === 'completado');

            if (filtroActual !== 'todos') {
                pendientes = pendientes.filter(v => v.vehiculo === filtroActual);
            }

            const btnPendientes = document.getElementById('btn-tab-pendientes');
            const btnAceptados = document.getElementById('btn-tab-aceptados');
            const btnCompletados = document.getElementById('btn-tab-completados');

            if (btnPendientes) btnPendientes.innerText = `Pendientes (${viajes.filter(v => v.estado === 'pendiente').length})`;
            if (btnAceptados) btnAceptados.innerText = `Aceptados (${aceptados.length})`;
            if (btnCompletados) btnCompletados.innerText = `Completados (${completados.length})`;

            if (contenedorPendientes) {
                contenedorPendientes.innerHTML = pendientes.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">No hay viajes disponibles.</p>' : '';
                pendientes.forEach(viaje => {
                    contenedorPendientes.innerHTML += `
                        <div class="tarjeta-viaje" data-id="${viaje.id}">
                            <div class="viaje-precio">
                                <h4>${viaje.precio}</h4>
                                <span class="distancia">${viaje.vehiculo}</span>
                            </div>
                            <div class="viaje-ruta">
                                <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                                <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                                <p>📅 <strong>Cuándo:</strong> ${viaje.detallesExtra?.tipoViaje || '⚡ Lo antes posible'}</p>
                            </div>
                            <div class="acciones-viaje" style="display:flex; gap:10px; margin-top:15px;">
                                <button class="btn-rechazar" onclick="gestionarViaje(${viaje.id}, 'rechazado')">Rechazar</button>
                                <button class="btn-aceptar" onclick="gestionarViaje(${viaje.id}, 'aceptado')">Aceptar</button>
                            </div>
                        </div>
                    `;
                });
            }

            if (contenedorAceptados) {
                contenedorAceptados.innerHTML = aceptados.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">No tenés viajes en curso.</p>' : '';
                aceptados.forEach(viaje => {
                    contenedorAceptados.innerHTML += `
                        <div class="tarjeta-viaje" data-id="${viaje.id}">
                            <div class="viaje-precio">
                                <h4>${viaje.precio}</h4>
                                <span class="distancia" style="background-color: #e2f0d9; color: #385723;">Aceptado</span>
                            </div>
                            <div class="viaje-ruta">
                                <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                                <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                            </div>
                            <button class="btn-principal" style="background-color: #28a745; margin-top:15px;" onclick="finalizarViajeConCalificacion(${viaje.id})">Finalizar viaje</button>
                        </div>
                    `;
                });
            }

            if (contenedorCompletados) {
                contenedorCompletados.innerHTML = completados.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">Sin historial todavía.</p>' : '';
                completados.forEach(viaje => {
                    contenedorCompletados.innerHTML += `
                        <div class="tarjeta-viaje" style="opacity: 0.85;" data-id="${viaje.id}">
                            <div class="viaje-precio">
                                <h4>${viaje.precio}</h4>
                                <span class="distancia" style="background-color: #eee; color: #666;">Completado</span>
                            </div>
                            <div class="viaje-ruta">
                                <p>📍 <strong>Origen:</strong> ${viaje.origen}</p>
                                <p>🏁 <strong>Destino:</strong> ${viaje.destino}</p>
                            </div>
                        </div>
                    `;
                });
            }
        });
    }

    // ==========================================
    // 8.1. VEHÍCULOS DEL PROVEEDOR
    // ==========================================
    const listaVehiculosProv = document.getElementById('lista-vehiculos-proveedor');
    if (listaVehiculosProv) {
        auth.onAuthStateChanged(async (user) => {
            if (!user) return;
            try {
                let docSnap = await db.collection("usuarios").doc(user.uid).get();
                if (!docSnap.exists) {
                    docSnap = await db.collection("usuarios").doc(user.email).get();
                }

                if (docSnap.exists) {
                    const data = docSnap.data();
                    const vehiculos = data.vehiculos || [];

                    if (vehiculos.length === 0) {
                        listaVehiculosProv.innerHTML = '<p style="color: #777; font-size: 14px;">No tenés vehículos registrados.</p>';
                    } else {
                        listaVehiculosProv.innerHTML = '';
                        vehiculos.forEach(v => {
                            const descTexto = v.descripcion ? `<br><small style="color: #666;">📝 ${v.descripcion}</small>` : '';
                            listaVehiculosProv.innerHTML += `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f9f9f9; padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #eee;">
                                    <div>
                                        <strong>${v.tipo}</strong> (Patente: <span style="text-transform: uppercase;">${v.patente}</span>)<br>
                                        💵 $ ${v.precioKm} / km
                                        ${descTexto}
                                    </div>
                                    <button type="button" onclick="eliminarVehiculoProveedor(${v.id})" style="background: #ff4d4d; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Eliminar</button>
                                </div>
                            `;
                        });
                    }
                }
            } catch (e) {
                console.error("Error cargando vehículos:", e);
            }
        });
    }

    // ==========================================
    // 9. VIAJES DEL CLIENTE
    // ==========================================
    const contenedorClientePendientes = document.getElementById('lista-cliente-pendientes');
    const contenedorClienteEnCurso = document.getElementById('lista-cliente-en-curso');
    const contenedorClienteHistorial = document.getElementById('lista-cliente-historial');

    if (contenedorClientePendientes || contenedorClienteEnCurso || contenedorClienteHistorial) {
        db.collection("viajes").onSnapshot((snapshot) => {
            let viajes = [];
            snapshot.forEach(doc => viajes.push(doc.data()));

            const misPendientes = viajes.filter(v => v.estado === 'pendiente');
            const misEnCurso = viajes.filter(v => v.estado === 'aceptado');
            const misHistorial = viajes.filter(v => v.estado === 'completado');

            const btnClP = document.getElementById('btn-cliente-pendientes');
            const btnClEC = document.getElementById('btn-cliente-en-curso');
            const btnClH = document.getElementById('btn-cliente-historial');

            if (btnClP) btnClP.innerText = `Buscando (${misPendientes.length})`;
            if (btnClEC) btnClEC.innerText = `En Camino (${misEnCurso.length})`;
            if (btnClH) btnClH.innerText = `Historial (${misHistorial.length})`;

            if (contenedorClientePendientes) {
                contenedorClientePendientes.innerHTML = misPendientes.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">No tenés fletes en búsqueda.</p>' : '';
                misPendientes.forEach(v => {
                    contenedorClientePendientes.innerHTML += `
                        <div class="tarjeta-viaje">
                            <div class="viaje-precio"><h4>${v.precio}</h4><span class="distancia">Buscando</span></div>
                            <div class="viaje-ruta"><p>📍 ${v.origen}</p><p>🏁 ${v.destino}</p></div>
                        </div>
                    `;
                });
            }

            if (contenedorClienteEnCurso) {
                contenedorClienteEnCurso.innerHTML = misEnCurso.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">No tenés fletes en curso.</p>' : '';
                misEnCurso.forEach(v => {
                    contenedorClienteEnCurso.innerHTML += `
                        <div class="tarjeta-viaje">
                            <div class="viaje-precio"><h4>${v.precio}</h4><span class="distancia" style="background:#e2f0d9; color:#385723;">En camino</span></div>
                            <div class="viaje-ruta"><p>📍 ${v.origen}</p><p>🏁 ${v.destino}</p></div>
                        </div>
                    `;
                });
            }

            if (contenedorClienteHistorial) {
                contenedorClienteHistorial.innerHTML = misHistorial.length === 0 ? '<p style="color: #777; text-align: center; padding: 20px;">Sin historial.</p>' : '';
                misHistorial.forEach(v => {
                    contenedorClienteHistorial.innerHTML += `
                        <div class="tarjeta-viaje" style="opacity: 0.85;">
                            <div class="viaje-precio"><h4>${v.precio}</h4><span class="distancia" style="background:#eee; color:#666;">Finalizado</span></div>
                            <div class="viaje-ruta"><p>📍 ${v.origen}</p><p>🏁 ${v.destino}</p></div>
                        </div>
                    `;
                });
            }
        });
    }

    // ==========================================
    // 10. PERFIL Y EDICIÓN
    // ==========================================
    const perfilNombre = document.getElementById('perfil-nombre');
    if (perfilNombre) {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }

            try {
                let docSnap = await db.collection("usuarios").doc(user.uid).get();
                if (!docSnap.exists) {
                    docSnap = await db.collection("usuarios").doc(user.email).get();
                }

                if (docSnap.exists) {
                    const datosUsuario = docSnap.data();
                    
                    perfilNombre.innerText = `${datosUsuario.nombre || ''} ${datosUsuario.apellido || ''}`.trim() || 'Usuario';
                    
                    const perfilEmail = document.getElementById('perfil-email');
                    if (perfilEmail) perfilEmail.innerText = datosUsuario.email || user.email;
                    
                    const perfilRol = document.getElementById('perfil-rol');
                    if (perfilRol && datosUsuario.rol) {
                        perfilRol.innerText = datosUsuario.rol.toUpperCase();
                    }

                    const inputNombre = document.getElementById('editar-nombre');
                    const inputApellido = document.getElementById('editar-apellido');
                    if (inputNombre) inputNombre.value = datosUsuario.nombre || '';
                    if (inputApellido) inputApellido.value = datosUsuario.apellido || '';

                    const seccionTarifas = document.getElementById('seccion-tarifas-perfil');
                    if (datosUsuario.rol === 'proveedor' && seccionTarifas) {
                        seccionTarifas.style.display = 'block';
                        const inputPrecioPiso = document.getElementById('editar-precio-piso');
                        const inputPrecioPeon = document.getElementById('editar-precio-peon');
                        
                        if (inputPrecioPiso && datosUsuario.tarifas) {
                            inputPrecioPiso.value = datosUsuario.tarifas.precioPiso || 0;
                        }
                        if (inputPrecioPeon && datosUsuario.tarifas) {
                            inputPrecioPeon.value = datosUsuario.tarifas.precioPeon || 0;
                        }
                    }

                    const navPerfil = document.getElementById('nav-perfil');
                    if (navPerfil) {
                        if (datosUsuario.rol === 'cliente') {
                            navPerfil.innerHTML = `
                                <a href="cliente.html" class="nav-item"><span class="icono">🏠</span><span>Inicio</span></a>
                                <a href="cliente-viajes.html" class="nav-item"><span class="icono">📦</span><span>Mis Viajes</span></a>
                                <a href="perfil.html" class="nav-item activo"><span class="icono">👤</span><span>Perfil</span></a>
                            `;
                        } else {
                            navPerfil.innerHTML = `
                                <a href="proveedor-perfil.html" class="nav-item"><span class="icono">📊</span><span>Mis Viajes</span></a>
                                <a href="perfil.html" class="nav-item activo"><span class="icono">👤</span><span>Perfil</span></a>
                            `;
                        }
                    }
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            }
        });
    }

    const formEditarPerfil = document.getElementById('form-editar-perfil');
    if (formEditarPerfil) {
        formEditarPerfil.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) return;

            const nuevoNombre = document.getElementById('editar-nombre').value.trim();
            const nuevoApellido = document.getElementById('editar-apellido').value.trim();

            if (!nuevoNombre || !nuevoApellido) {
                mostrarModalMensaje('Campos incompletos', 'Nombre y apellido obligatorios.', 'advertencia');
                return;
            }

            try {
                let userRef = db.collection("usuarios").doc(user.uid);
                let docSnap = await userRef.get();
                if (!docSnap.exists) {
                    userRef = db.collection("usuarios").doc(user.email);
                    docSnap = await userRef.get();
                }

                if (!docSnap.exists) return;

                let userData = docSnap.data();
                userData.nombre = nuevoNombre;
                userData.apellido = nuevoApellido;

                if (userData.rol === 'proveedor') {
                    const nuevoPiso = parseFloat(document.getElementById('editar-precio-piso').value) || 0;
                    const nuevoPeon = parseFloat(document.getElementById('editar-precio-peon').value) || 0;

                    if (!userData.tarifas) userData.tarifas = {};
                    userData.tarifas.precioPiso = nuevoPiso;
                    userData.tarifas.precioPeon = nuevoPeon;
                }

                await userRef.set(userData);
                mostrarModalMensaje('¡Actualizado!', 'Perfil actualizado con éxito.', 'exito', () => {
                    location.reload();
                });
            } catch (error) {
                console.error("Error al actualizar perfil:", error);
                mostrarModalMensaje('Error', 'Hubo un error al guardar los cambios.', 'error');
            }
        });
    }

    // ==========================================
    // 11. ESTADÍSTICAS DEL PROVEEDOR
    // ==========================================
    const statGanancias = document.getElementById('stat-ganancias');
    if (statGanancias) {
        db.collection("viajes").onSnapshot((snapshot) => {
            let viajes = [];
            snapshot.forEach(doc => viajes.push(doc.data()));
            const completados = viajes.filter(v => v.estado === 'completado');

            let totalGanancias = 0;
            let sumaCalificaciones = 0;

            completados.forEach(v => {
                if (v.precio) {
                    totalGanancias += parseInt(v.precio.replace('$', '').replace(/\./g, '').trim()) || 0;
                }
                if (v.calificacionProveedor) {
                    sumaCalificaciones += v.calificacionProveedor;
                }
            });

            document.getElementById('stat-ganancias').innerText = `$ ${totalGanancias.toLocaleString('es-AR')}`;
            document.getElementById('stat-viajes').innerText = completados.length;
            
            const promedio = completados.length > 0 ? (sumaCalificaciones / completados.length).toFixed(1) : '-';
            document.getElementById('stat-calificacion').innerText = `⭐ ${promedio}`;
        });
    }

    if (localStorage.getItem('fletarg_dark_mode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

}); // FIN DOMContentLoaded


// ==========================================
// FUNCIONES GLOBALES Y MODAL PERSONALIZADO
// ==========================================

function mostrarModalMensaje(titulo, mensaje, tipo = 'exito', callback = null) {
    let modal = document.getElementById('modal-global');
    
    if (!modal) {
        const divModal = document.createElement('div');
        divModal.id = 'modal-global';
        divModal.className = 'modal-overlay oculto';
        divModal.innerHTML = `
            <div class="modal-content" style="text-align: center; padding: 30px 20px;">
                <div id="modal-icono" style="font-size: 40px; margin-bottom: 10px;">✨</div>
                <h3 id="modal-titulo" style="font-size: 18px; color: #2b3a4a; margin-bottom: 8px;">Aviso</h3>
                <p id="modal-texto" style="font-size: 14px; color: #666; margin-bottom: 20px; line-height: 1.4;"></p>
                <button type="button" id="btn-modal-aceptar" class="btn-principal" style="padding: 12px; font-size: 14px;">Aceptar</button>
            </div>
        `;
        document.body.appendChild(divModal);
        modal = divModal;

        document.getElementById('btn-modal-aceptar').addEventListener('click', () => {
            cerrarModalGlobal();
            if (typeof callback === 'function') callback();
        });
    } else {
        const btnAceptar = document.getElementById('btn-modal-aceptar');
        if (btnAceptar) {
            const nuevoBtn = btnAceptar.cloneNode(true);
            btnAceptar.parentNode.replaceChild(nuevoBtn, btnAceptar);
            nuevoBtn.addEventListener('click', () => {
                cerrarModalGlobal();
                if (typeof callback === 'function') callback();
            });
        }
    }

    const tituloEl = document.getElementById('modal-titulo');
    const textoEl = document.getElementById('modal-texto');
    const iconoEl = document.getElementById('modal-icono');

    if (tituloEl) tituloEl.innerText = titulo;
    if (textoEl) textoEl.innerText = mensaje;

    if (iconoEl) {
        if (tipo === 'error') {
            iconoEl.innerText = '⚠️';
        } else if (tipo === 'advertencia') {
            iconoEl.innerText = '🔒';
        } else {
            iconoEl.innerText = '✨';
        }
    }

    modal.classList.remove('oculto');
}

function cerrarModalGlobal() {
    const modal = document.getElementById('modal-global');
    if (modal) modal.classList.add('oculto');
}

function registrarAccionEnBitacora(tipoAccion, descripcion, usuarioInvolucrado = 'Anónimo') {
    const nuevoRegistro = {
        id: Date.now(),
        fechaHora: new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        tipo: tipoAccion, 
        descripcion: descripcion,
        usuario: usuarioInvolucrado
    };
    db.collection("auditoria").doc(nuevoRegistro.id.toString()).set(nuevoRegistro).catch(err => {});
}

function mostrarFormulario(rol) {
    document.getElementById('seleccion-perfil').style.display = 'none';
    document.getElementById('titulo-registro').innerText = rol === 'cliente' ? 'Registro de Cliente' : 'Registro de Proveedor';
    document.getElementById('form-registro').style.display = 'block';
    document.getElementById('rol-elegido').value = rol;

    const camposProveedor = document.getElementById('campos-proveedor');
    if (camposProveedor) {
        camposProveedor.style.display = rol === 'proveedor' ? 'block' : 'none';
    }
}

function volverSeleccion() {
    document.getElementById('form-registro').style.display = 'none';
    document.getElementById('seleccion-perfil').style.display = 'flex';
    document.getElementById('titulo-registro').innerText = 'Elegí tu tipo de cuenta';
}

function cambiarPestana(nombrePestana) {
    ['pendientes', 'aceptados', 'completados'].forEach(p => {
        const sec = document.getElementById(`seccion-${p}`);
        if (sec) sec.style.display = p === nombrePestana ? 'block' : 'none';
    });
    document.querySelectorAll('.pestana-btn').forEach(btn => btn.classList.remove('activa'));
    if (event && event.target) event.target.classList.add('activa');
}

function cambiarPestanaCliente(nombrePestana) {
    ['pendientes', 'en-curso', 'historial'].forEach(p => {
        const sec = document.getElementById(`seccion-cliente-${p}`);
        if (sec) sec.style.display = p === nombrePestana ? 'block' : 'none';
    });
    document.querySelectorAll('.pestana-btn').forEach(btn => btn.classList.remove('activa'));
    if (event && event.target) event.target.classList.add('activa');
}

function togglePrecioPeon(select) {
    const contenedor = document.getElementById('contenedor-precio-peon');
    const inputPrecio = document.getElementById('precio-peon');
    if (select.value === 'si') {
        contenedor.style.display = 'block';
    } else {
        contenedor.style.display = 'none';
        if (inputPrecio) inputPrecio.value = '';
    }
}

async function agregarVehiculoProveedor() {
    const user = auth.currentUser;
    if (!user) return;

    const tipo = document.getElementById('nuevo-tipo-vehiculo').value;
    const patenteInput = document.getElementById('nueva-patente');
    const patente = patenteInput ? patenteInput.value.trim().toUpperCase() : '';
    const precioKm = parseFloat(document.getElementById('nuevo-precio-km').value);
    const descripcion = document.getElementById('nueva-descripcion').value.trim();

    const regexPatente = /^[A-Z0-9]+$/;
    if (!patente || !regexPatente.test(patente)) {
        mostrarModalMensaje('Patente inválida', 'Debe contener solo letras y números.', 'advertencia');
        if (patenteInput) patenteInput.focus();
        return;
    }

    if (!precioKm || precioKm <= 0) {
        mostrarModalMensaje('Valor inválido', 'Ingresá un valor por kilómetro válido.', 'advertencia');
        return;
    }

    try {
        let userRef = db.collection("usuarios").doc(user.uid);
        let docSnap = await userRef.get();
        if (!docSnap.exists) {
            userRef = db.collection("usuarios").doc(user.email);
            docSnap = await userRef.get();
        }
        
        if (docSnap.exists) {
            let userData = docSnap.data();
            let vehiculos = userData.vehiculos || [];

            const patenteExistente = vehiculos.some(v => v.patente === patente);
            if (patenteExistente) {
                mostrarModalMensaje('Patente duplicada', 'Ya tenés un vehículo registrado con esa patente.', 'advertencia');
                return;
            }

            vehiculos.push({
                id: Date.now(),
                tipo: tipo,
                patente: patente,
                precioKm: precioKm,
                descripcion: descripcion
            });

            await userRef.update({ vehiculos: vehiculos });
            mostrarModalMensaje('¡Vehículo agregado!', 'Registrado con éxito.', 'exito', () => {
                location.reload();
            });
        }
    } catch (error) {
        console.error("Error al agregar vehículo:", error);
        mostrarModalMensaje('Error', 'No se pudo guardar el vehículo.', 'error');
    }
}

async function eliminarVehiculoProveedor(idVehiculo) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        let userRef = db.collection("usuarios").doc(user.uid);
        let docSnap = await userRef.get();
        if (!docSnap.exists) {
            userRef = db.collection("usuarios").doc(user.email);
            docSnap = await userRef.get();
        }
        
        if (docSnap.exists) {
            let userData = docSnap.data();
            let vehiculos = userData.vehiculos || [];

            vehiculos = vehiculos.filter(v => v.id !== idVehiculo);

            await userRef.update({ vehiculos: vehiculos });
            mostrarModalMensaje('Vehículo eliminado', 'Eliminado correctamente.', 'exito', () => {
                location.reload();
            });
        }
    } catch (error) {
        console.error("Error al eliminar vehículo:", error);
        mostrarModalMensaje('Error', 'No se pudo eliminar el vehículo.', 'error');
    }
}

async function gestionarViaje(idViaje, nuevoEstado) {
    try {
        await db.collection("viajes").doc(idViaje.toString()).update({ estado: nuevoEstado });
        const user = auth.currentUser;
        registrarAccionEnBitacora('ESTADO_VIAJE', `Viaje ID ${idViaje} cambió a: ${nuevoEstado}`, user ? user.email : 'Proveedor');
        mostrarModalMensaje('Actualizado', `El viaje fue ${nuevoEstado} exitosamente.`, 'exito');
    } catch (error) {
        mostrarModalMensaje('Error', 'Hubo un error al actualizar el estado.', 'error');
    }
}

async function finalizarViajeConCalificacion(idViaje) {
    let calificacionProv = prompt('Calificá la experiencia con el cliente (1 a 5):', '5');
    if (calificacionProv === null) return; 

    let estrellas = parseInt(calificacionProv);
    if (isNaN(estrellas) || estrellas < 1 || estrellas > 5) {
        mostrarModalMensaje('Valor inválido', 'Ingresá un número entre 1 y 5.', 'advertencia');
        return;
    }

    try {
        await db.collection("viajes").doc(idViaje.toString()).update({
            estado: 'completado',
            calificacionProveedor: estrellas
        });
        const user = auth.currentUser;
        registrarAccionEnBitacora('VIAJE_FINALIZADO', `Viaje ID ${idViaje} finalizado. Calificación: ${estrellas} estrellas`, user ? user.email : 'Proveedor');
        mostrarModalMensaje('¡Viaje finalizado!', 'Servicio completado con éxito.', 'exito');
    } catch (error) {
        mostrarModalMensaje('Error', 'Hubo un error al finalizar el viaje.', 'error');
    }
}

async function cerrarSesion() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {}
}

async function borrarCuenta() {
    const user = auth.currentUser;
    if (!user) {
        mostrarModalMensaje('Aviso', 'No hay sesión activa.', 'advertencia');
        return;
    }

    const confirmacion2 = prompt('⚠️ ¿Estás COMPLETAMENTE seguro? Escribí la palabra BORRAR en mayúsculas:');
    if (confirmacion2 !== 'BORRAR') {
        mostrarModalMensaje('Operación cancelada', 'La palabra no coincide.', 'advertencia');
        return;
    }

    try {
        const uidUsuario = user.uid;
        const emailUsuario = user.email;

        await db.collection("usuarios").doc(uidUsuario).delete().catch(() => {});
        await db.collection("usuarios").doc(emailUsuario).delete().catch(() => {});
        
        await user.delete();

        mostrarModalMensaje('Cuenta eliminada', 'Tus datos fueron eliminados de la nube.', 'exito', () => {
            window.location.href = 'index.html';
        });
    } catch (error) {
        console.error("Error al borrar cuenta:", error);
        if (error.code === 'auth/requires-recent-login') {
            mostrarModalMensaje('Seguridad', 'Volvé a iniciar sesión para borrar la cuenta.', 'advertencia');
        } else {
            mostrarModalMensaje('Error', 'Ocurrió un error al borrar la cuenta: ' + error.message, 'error');
        }
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('fletarg_dark_mode', 'enabled');
    } else {
        localStorage.setItem('fletarg_dark_mode', 'disabled');
    }
}

function filtrarViajes(tipoVehiculo, botonElemento) {
    const botones = document.querySelectorAll('.btn-filtro');
    botones.forEach(b => b.classList.remove('activo'));
    botonElemento.classList.add('activo');
    if (typeof renderizarViajesProveedor === 'function') {
        renderizarViajesProveedor(tipoVehiculo);
    }
}

async function enviarCodigoRecuperoPagina(e) {
    e.preventDefault();
    const email = document.getElementById('email-recupero')?.value.trim();
    if (!email) {
        mostrarModalMensaje('Falta correo', 'Ingresá tu correo electrónico.', 'advertencia');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        mostrarModalMensaje('Correo enviado', `📧 Enlace enviado a ${email}.`, 'exito', () => {
            window.location.href = 'index.html';
        });
    } catch (error) {
        mostrarModalMensaje('Error', 'No se pudo enviar el correo de recuperación.', 'error');
    }
}