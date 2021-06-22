//EJEMPLOS DE TEST DEL CONTRATO CON TRUFFLE Y GANACHE
//Contrato que vamos a usar
const Airline = artifacts.require('Airline');

let instance;
/* beforeEach Crea una nueva istancia para cada test, por si el contrato se encuentra modificado
o en un estado que no sea el inicial */
beforeEach(async () => {
    instance = await Airline.new();
});

contract('Airline', accounts => {
    // 1º TEST comprobar que la aerolinea tiene vuelos creados
    it('should have available flights', async () => {
        let total = await instance.totalFlights();
        assert(total > 0);
    });

    // 2º TEST permite comprar un vuelo si proveen el valor

    it('should allow customers to buy a flight providing its value', async () => {
        //Recuperar un vuelo (el 0 en este caso)
        let flight = await instance.flights(0);
        let flightName = flight[0], price = flight[1];
        //vemos el nombre del vuelo y su precio en bignumber 
        console.log (flight);

        //Comprar un vuelo el 0 con la cuenta 0
        await instance.buyFlight(0, { from: accounts[0], value: price });
        //Recuperamos los vuelos del cliente 0
        let customerFlight = await instance.customerFlights(accounts[0], 0);
        //Comprobar el número total de vuelos comprados por el cliente
        let customerTotalFlights = await instance.customerTotalFlights(accounts[0]);
        //Comprueba la compra del vuelo y los vuelos totales del cliente
        console.log(customerFlight, customerTotalFlights);

        //Evalua que todo está correcto
        assert(customerFlight[0], flightName);
        assert(customerFlight[1], price);
        assert(customerTotalFlights, 1);
    });

    //3º TEST no debe poder comprar un vuelo por menos de su precio

    it('should not allow customers to buy flights under the price', async () => {

        let flight = await instance.flights(0);
        /*Captura de errores Si es menor de 5000 daria un error que lo capturamos con catch 
        si es mayor try se ejecutaría y compraría el vuelo*/
        let price = flight[1] -5000;

        try {
            await instance.buyFlight(0, { from: accounts[0], value: price });
        }
        catch (e) { return; }
        assert.fail();
    });

    //4º TEST comprobar que el balance de la aerolinea es el correcto

    it('should get the real balance of the contract', async() => {
        //Recupera 1 vuelo destino, precio
        let flight = await instance.flights(0);
        let price = flight[1];
        //Recupera otro vuelo destino, precio
        let flight2 = await instance.flights(1);
        let price2 = flight2[1];
        //Compramos los dos vuelos
        await instance.buyFlight(0, { from: accounts[0], value: price});
        await instance.buyFlight(1, { from: accounts[0], value: price2});
        //Obtenemos el nuevo balance de la aerolinea
        let newAirlineBalance = await instance.getAirlineBalance();
        // Aserción sumar los dos precios de los vuelos
        assert.equal(newAirlineBalance.toNumber(), price.toNumber() + price2.toNumber());
    });
    
    //5º TEST La aerolinea debe permitir cambiar sus puntos de lealtad por divisas de ether

    it('should allow customers to redeem loyalty points', async() => {
        //Recuperamos 1 vuelo
        let flight = await instance.flights(1);
        //Sacamos el precio
        let price = flight[1];

        //Compramos vuelo 1 desde cuenta 0

        await instance.buyFlight(1, { from: accounts[0], value : price});

        //Recuperar el balance
        let balance = await web3.eth.getBalance(accounts[0]);
        //Canjea sus puntos de lealtad
        await instance.redeemLoyaltyPoints({from: accounts[0]});
        //Recuperamos el balance final de los puntos
        let finalBalance = await web3.eth.getBalance(accounts[0]);
        //Resetear los puntos utilizados
        let customer = await instance.customers(accounts[0]);
        let loyaltyPoints = customer[0];

        assert(loyaltyPoints, 0);
        assert(finalBalance > balance);
    });
});
